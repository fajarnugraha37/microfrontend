<template>
  <section class="users-saas">
    <div class="users-header">
      <h1 class="users-title">User Management</h1>
      <p class="users-desc">Manage your team and roles in a modern SaaS workspace.</p>
    </div>
    <div v-if="!isAuthenticated" class="users-empty">
      <p>Please login to see privileged content.</p>
    </div>
    <div v-else class="users-list">
      <div class="users-permission">
        <span class="users-permission-label">Manage Users Permission:</span>
        <span :class="['users-permission-badge', canManageUsers ? 'yes' : 'no']">
          {{ canManageUsers ? 'Granted' : 'Denied' }}
        </span>
      </div>
      <div class="user-cards">
        <div v-for="user in demoUsers" :key="user.id" class="user-card">
          <div class="user-avatar">
            <span>{{ user.name.charAt(0) }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role-badge">{{ user.role }}</div>
          </div>
        </div>
      </div>
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
.users-saas {
  background: #fff;
  border-radius: 12px;
  padding: 2rem 2rem 1.5rem 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  max-width: 900px;
  margin: 2rem auto;
}
.users-header {
  text-align: center;
  margin-bottom: 2rem;
}
.users-title {
  font-size: 2rem;
  font-weight: 700;
  color: #35495e;
  margin-bottom: 0.5rem;
}
.users-desc {
  color: #6b6f76;
  font-size: 1.1rem;
}
.users-empty {
  text-align: center;
  color: #e74c3c;
  font-size: 1.1rem;
  margin-top: 2rem;
}
.users-list {
  margin-top: 1rem;
}
.users-permission {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}
.users-permission-label {
  font-weight: 500;
  color: #35495e;
}
.users-permission-badge {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
}
.users-permission-badge.yes {
  background: #27ae60;
}
.users-permission-badge.no {
  background: #e74c3c;
}
.user-cards {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}
.user-card {
  background: #f7f9fa;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  padding: 1.25rem 1rem;
  min-width: 180px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}
.user-avatar {
  width: 48px;
  height: 48px;
  background: #3498db;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.user-info {
  text-align: center;
}
.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #35495e;
  margin-bottom: 0.25rem;
}
.user-role-badge {
  background: #bfc3c9;
  color: #35495e;
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  display: inline-block;
}
</style>
