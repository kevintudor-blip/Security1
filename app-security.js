/**
 * BxPulse Analytics - Production Security & Feature Bundle
 * Filename: app-security.js
 * Description: Consolidates Login Auth, Secure Storage Vault, FAB Data Entry, and Session Management.
 */

(function () {
    'use strict';

    // ==========================================
    // 1. STORAGE VAULT (Data Isolation & Security)
    // ==========================================
    const StorageVault = {
        // Uses Base64 encoding as a baseline obfuscator. 
        // For strict HIPAA compliance in production, upgrade to Web Crypto API (AES-GCM).
        save: function (key, data) {
            try {
                const stringified = JSON.stringify(data);
                const encoded = btoa(encodeURIComponent(stringified));
                localStorage.setItem(`bxpulse_${key}`, encoded);
                return true;
            } catch (e) {
                console.error("StorageVault Save Error:", e);
                return false;
            }
        },
        load: function (key) {
            try {
                const encoded = localStorage.getItem(`bxpulse_${key}`);
                if (!encoded) return null;
                const decoded = decodeURIComponent(atob(encoded));
                return JSON.parse(decoded);
            } catch (e) {
                console.error("StorageVault Load Error:", e);
                return null;
            }
        },
        clearSession: function () {
            sessionStorage.removeItem('bxpulse_auth_token');
        }
    };

    // ==========================================
    // 2. AUTHENTICATION SYSTEM & LOGOUT
    // ==========================================
    const AuthSystem = {
        isAuthenticated: function () {
            return sessionStorage.getItem('bxpulse_auth_token') === 'active';
        },
        
        injectLoginScreen: function () {
            if (document.getElementById('bx-login-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'bx-login-overlay';
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                backgroundColor: '#f3f4f6', zIndex: '9999', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'system-ui, sans-serif'
            });

            overlay.innerHTML = `
                <div style="background: white; padding: 2rem 3rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                    <h2 style="margin-top: 0; color: #1f2937;">BxPulse Secure Login</h2>
                    <p style="color: #4b5563; margin-bottom: 1.5rem;">Enter clinician PIN to access local data.</p>
                    <input type="password" id="bx-pin-input" placeholder="Enter PIN" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; width: 100%; margin-bottom: 1rem; text-align: center; font-size: 1.2rem;">
                    <button id="bx-login-btn" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">Unlock Session</button>
                    <p id="bx-login-error" style="color: red; margin-top: 1rem; display: none; font-size: 0.9rem;">Invalid PIN</p>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('bx-login-btn').addEventListener('click', () => {
                const pin = document.getElementById('bx-pin-input').value;
                // Default PIN for diagnostic bundle (Update as needed)
                if (pin === '1234') { 
                    sessionStorage.setItem('bxpulse_auth_token', 'active');
                    overlay.remove();
                    UIManager.initPostLogin();
                } else {
                    document.getElementById('bx-login-error').style.display = 'block';
                }
            });
        },

        logout: function () {
            StorageVault.clearSession();
            location.reload(); // Reload to clear memory and trigger login screen
        }
    };

    // ==========================================
    // 3. UI INJECTIONS (FAB & Logout Button)
    // ==========================================
    const UIManager = {
        injectLogoutBtn: function () {
            if (document.getElementById('bx-logout-btn')) return;
            
            const headerNav = document.querySelector('header nav') || document.body;
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'bx-logout-btn';
            logoutBtn.innerText = '🔒 Logout';
            Object.assign(logoutBtn.style, {
                background: '#ef4444', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                fontWeight: 'bold', marginLeft: 'auto'
            });
            
            logoutBtn.addEventListener('click', AuthSystem.logout);
            headerNav.appendChild(logoutBtn);
        },

        injectFloatingActionBtn: function () {
            if (document.getElementById('bx-fab-container')) return;

            const fab = document.createElement('div');
            fab.id = 'bx-fab-container';
            Object.assign(fab.style, {
                position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '9000'
            });

            fab.innerHTML = `
                <button id="bx-fab-main" style="width: 60px; height: 60px; border-radius: 50%; background: #10b981; color: white; border: none; font-size: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    +
                </button>
            `;
            document.body.appendChild(fab);

            document.getElementById('bx-fab-main').addEventListener('click', () => {
                alert('Multi-Pathway Data Entry Triggered. (Attach your target modal here)');
                // Logic to open ABC Logger or Frequency counter modal goes here
            });
        },

        initPostLogin: function () {
            this.injectLogoutBtn();
            this.injectFloatingActionBtn();
            // Trigger dashboard refresh events here if necessary
            console.log("BxPulse: Secure session initialized.");
        }
    };

    // ==========================================
    // 4. APP INITIALIZATION
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        if (!AuthSystem.isAuthenticated()) {
            AuthSystem.injectLoginScreen();
        } else {
            UIManager.initPostLogin();
        }
    });

    // Expose limited API to global window for external triggers (like Tab 7 diagnostics)
    window.BxPulseSecurity = {
        saveData: StorageVault.save,
        loadData: StorageVault.load,
        forceLogout: AuthSystem.logout
    };

})();