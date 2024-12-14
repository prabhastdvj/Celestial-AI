// Firebase initialization
const auth = firebase.auth();
const db = firebase.firestore();

// Google provider setup
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const signupError = document.getElementById('signupError');
const signupSuccess = document.getElementById('signupSuccess');

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
        // Show loading state
        submitBtn.innerHTML = '<div class="btn-loader"></div> Logging in...';
        submitBtn.disabled = true;
        loginError.style.display = 'none';

        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get or create user profile
        let userProfile;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userProfile = userDoc.data();
            } else {
                userProfile = {
                    uid: user.uid,
                    email: user.email,
                    username: email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                // Create new user document
                await db.collection('users').doc(user.uid).set(userProfile);
            }
        } catch (dbError) {
            console.warn('Database error:', dbError);
            // Fallback profile if database fails
            userProfile = {
                uid: user.uid,
                email: user.email,
                username: email.split('@')[0]
            };
        }

        // Update last login in background
        db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.warn);

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Show success message
        loginSuccess.textContent = 'Login successful!';
        loginSuccess.style.display = 'block';
        loginError.style.display = 'none';

        // Redirect immediately
        window.location.href = '/';

    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = getErrorMessage(error);
        
        // Show error message
        loginError.textContent = errorMessage;
        loginError.style.display = 'block';
        loginSuccess.style.display = 'none';

        // Reset password field on invalid credentials
        if (error.code === 'auth/invalid-login-credentials' || 
            error.code === 'auth/wrong-password') {
            document.getElementById('loginPassword').value = '';
            document.getElementById('loginPassword').focus();
        }

    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Signup form handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        submitBtn.innerHTML = '<div class="btn-loader"></div> Creating Account...';
        submitBtn.disabled = true;
        signupError.style.display = 'none';

        const { user } = await auth.createUserWithEmailAndPassword(email, password);

        // Create user profile
        const userProfile = {
            uid: user.uid,
            email: email,
            firstName,
            lastName,
            username: email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to localStorage and redirect immediately
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Save to Firestore in background
        db.collection('users').doc(user.uid).set(userProfile)
            .catch(error => console.warn('Firestore save error:', error));

        window.location.replace('/');

    } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = getErrorMessage(error);
        signupError.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Google Sign In handler
document.querySelector('.btn-google').addEventListener('click', async () => {
    const button = document.querySelector('.btn-google');
    const originalText = button.innerHTML;

    try {
        button.innerHTML = '<div class="btn-loader"></div> Connecting...';
        button.disabled = true;

        const { user } = await auth.signInWithPopup(googleProvider);

        const userProfile = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            username: user.email.split('@')[0],
            photoURL: user.photoURL,
            provider: 'google'
        };

        // Save to localStorage and redirect immediately
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Update Firestore in background
        db.collection('users').doc(user.uid).set(userProfile, { merge: true })
            .catch(console.warn);

        window.location.replace('/');

    } catch (error) {
        console.error('Google login error:', error);
        loginError.textContent = getErrorMessage(error);
        loginError.style.display = 'block';
        button.disabled = false;
        button.innerHTML = originalText;
    }
});

// Form toggle handler
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupBtn = document.querySelector('.signup-btn');
    const backBtn = document.querySelector('.back-to-login');
    const socialLogin = document.querySelector('.social-login');
    const divider = document.querySelector('.divider');

    // Add animation classes
    if (loginForm.style.display === 'block' || loginForm.style.display === '') {
        // Switch to signup
        loginForm.style.opacity = '0';
        setTimeout(() => {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            signupBtn.style.display = 'none';
            backBtn.style.display = 'block';
            socialLogin.style.display = 'none';
            divider.style.display = 'none';
            // Trigger reflow
            void signupForm.offsetWidth;
            signupForm.style.opacity = '1';
        }, 150);
    } else {
        // Switch to login
        signupForm.style.opacity = '0';
        setTimeout(() => {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            signupBtn.style.display = 'block';
            backBtn.style.display = 'none';
            socialLogin.style.display = 'block';
            divider.style.display = 'block';
            // Trigger reflow
            void loginForm.offsetWidth;
            loginForm.style.opacity = '1';
        }, 150);
    }

    // Clear errors and forms
    loginError.style.display = 'none';
    signupError.style.display = 'none';
    loginForm.reset();
    signupForm.reset();
}

// Error message helper
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-login-credentials':
        case 'auth/wrong-password':
            return 'Invalid email or password. Please try again.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const backBtn = document.querySelector('.back-to-login');
    const signupBtn = document.querySelector('.signup-btn');
    
    // Set initial state
    loginForm.style.display = 'block';
    loginForm.style.opacity = '1';
    signupForm.style.display = 'none';
    signupForm.style.opacity = '0';
    backBtn.style.display = 'none';

    // Add click handlers
    signupBtn?.addEventListener('click', toggleForms);
    backBtn?.addEventListener('click', toggleForms);

    // Add transition styles
    loginForm.style.transition = 'opacity 150ms ease-in-out';
    signupForm.style.transition = 'opacity 150ms ease-in-out';
}); 