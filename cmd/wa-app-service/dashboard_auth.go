package main

import (
	"crypto/sha256"
	"crypto/subtle"
	"errors"
	"net/http"
	"strings"
)

type dashboardAuthConfig struct {
	username string
	password string
}

var errIncompleteDashboardAuth = errors.New("WA_APP_AUTH_USERNAME and WA_APP_AUTH_PASSWORD must be configured together")

func newDashboardAuthConfig(username string, password string) (dashboardAuthConfig, error) {
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)
	if username == "" && password == "" {
		return dashboardAuthConfig{}, nil
	}
	if username == "" || password == "" {
		return dashboardAuthConfig{}, errIncompleteDashboardAuth
	}
	return dashboardAuthConfig{username: username, password: password}, nil
}

func (c dashboardAuthConfig) enabled() bool {
	return c.username != "" && c.password != ""
}

func withOptionalDashboardAuth(next http.Handler, auth dashboardAuthConfig) http.Handler {
	if !auth.enabled() {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/healthz" || authenticatedDashboardRequest(r, auth) {
			next.ServeHTTP(w, r)
			return
		}
		w.Header().Set("WWW-Authenticate", `Basic realm="wa-app", charset="UTF-8"`)
		w.Header().Set("Cache-Control", "no-store")
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
	})
}

func authenticatedDashboardRequest(r *http.Request, auth dashboardAuthConfig) bool {
	username, password, ok := r.BasicAuth()
	return ok && secureEqualString(username, auth.username) && secureEqualString(password, auth.password)
}

func secureEqualString(left string, right string) bool {
	leftHash := sha256.Sum256([]byte(left))
	rightHash := sha256.Sum256([]byte(right))
	return subtle.ConstantTimeCompare(leftHash[:], rightHash[:]) == 1
}
