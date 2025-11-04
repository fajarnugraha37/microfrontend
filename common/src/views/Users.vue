<template>
  <section class="users">
    <h2>Local Users Page</h2>
    <p>This page lives inside the shell application.</p>
    <div v-if="!isAuthenticated" class="users__empty">
      <p>Please login to see privileged content.</p>
    </div>
    <div v-else class="users__content">
      <p>
        Current user has
        <strong v-if="canManageUsers">permission</strong>
        <strong v-else>no permission</strong>
        to manage users.
      </p>
      <ul>
        <li v-for="user in demoUsers" :key="user.id">
          {{ user.name }} — {{ user.role }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { checkPermissions } from '../utils';

export default {
  name: 'UsersView',
  computed: {
    ...mapGetters(['isAuthenticated']),
    ...mapState(['user']),
    canManageUsers() {
      return checkPermissions(this.user, 'manage-users');
    },
    demoUsers() {
      return [
        { id: 1, name: 'Jane Roe', role: 'Analyst' },
        { id: 2, name: 'Sarah Smith', role: 'Manager' },
        { id: 3, name: 'Akhil Kumar', role: 'Support' }
      ];
    }
  }
};
</script>

<style scoped>
.users {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.users__empty {
  margin-top: 1rem;
  color: #6b6f76;
}

.users__content ul {
  margin-top: 1rem;
  padding-left: 1.25rem;
}
</style>
