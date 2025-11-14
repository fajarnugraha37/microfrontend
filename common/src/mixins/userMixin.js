/**
 * User mixin for fetching user data
 */
import { UserService } from '../services/user';
export default {
  data() {
    return {
      users: []
    };
  },
  methods: {
    async fetchUsers() {
      const service = UserService();
      const res = await service.getUsers();
      this.users = res.data.users;
    }
  }
};
