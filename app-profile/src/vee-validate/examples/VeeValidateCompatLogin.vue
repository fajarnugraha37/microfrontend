<template>
    <div class="login-card">
        <ValidationObserver v-slot="{ validate, invalid }">
            <form @submit.prevent="onLogin(validate)" class="login-form">
                <h2 class="login-title">Login</h2>

                <!-- USERNAME -->
                <div class="login-field">
                    <label for="username">Username</label>

                    <ValidationProvider name="username" rules="required|email"
                        v-slot="{ errors, value, onInput, onBlur }">
                        <input id="username" type="text" class="login-input" :value="value"
                            @input="(e) => { onInput(e); userNameInput = e.target.value; }" @blur="onBlur" />
                        <span v-if="errors[0]" class="login-error">
                            {{ errors[0] }}
                        </span>
                    </ValidationProvider>
                </div>

                <!-- PASSWORD -->
                <div class="login-field">
                    <label for="password">Password</label>

                    <ValidationProvider name="password" rules="required|min:8|validPassword"
                        v-slot="{ errors, value, onInput, onBlur }">
                        <input id="password" type="password" class="login-input" autocomplete="new-password"
                            :value="value" @input="(e) => { onInput(e); passwordInput = e.target.value; }"
                            @blur="onBlur" />
                        <span v-if="errors[0]" class="login-error">
                            {{ errors[0] }}
                        </span>
                    </ValidationProvider>
                </div>

                <button type="submit" class="login-btn" :disabled="invalid">
                    Login
                </button>

                <div v-if="error" class="login-error">
                    {{ error }}
                </div>
            </form>
        </ValidationObserver>
    </div>
</template>

<script>
import ValidationObserver from '../ValidationObserver.vue';
import ValidationProvider from '../ValidationProvider.vue';

export default {
    name: 'LoginForm',
    components: {
        ValidationObserver,
        ValidationProvider,
    },
    data() {
        return {
            userNameInput: '',
            passwordInput: '',
            error: null,
        };
    },
    emits: ['login-success', 'login-failure'],
    methods: {
        async onLogin(validate) {
            // this replaces this.$validator.validateAll()
            const valid = await validate();
            if (!valid) {
                this.$emit('login-failure', valid);
                return;
            }
            try {
                console.log('Logging in with', this.userNameInput, this.passwordInput);
                this.$emit('login-success', { username: this.userNameInput, password: this.passwordInput });
                this.error = null;
            } catch (e) {
                this.error =
                    e?.response?.data?.message || 'Login failed';
                this.$emit('login-failure', this.error);
            }
        },
    },
};
</script>

<style scoped>
/* your styles unchanged */
.login-card {
    max-width: 400px;
    margin: 3rem auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    padding: 2rem 2rem 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.login-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.login-title {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #35495e;
}

.login-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.login-input {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #bfc3c9;
    font-size: 1rem;
    background: #f7f9fa;
    transition: border 0.2s;
}

.login-input:focus {
    border-color: #3498db;
    outline: none;
}

.login-btn {
    background: #3498db;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.login-btn:hover {
    background: #217dbb;
}

.login-error {
    color: #e74c3c;
    text-align: center;
    margin-top: 0.5rem;
    font-size: 1rem;
}
</style>
