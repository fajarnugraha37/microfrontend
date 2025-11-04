<template>
  <article class="dashboard-details">
    <h3>Team Notes</h3>
    <form @submit.prevent="addNote">
      <c-input
        v-model="form.title"
        label="Title"
        placeholder="Release 1.0"
      />
      <c-input
        v-model="form.description"
        label="Description"
        placeholder="What should teammates know?"
      />
      <c-button type="submit">Add Note</c-button>
    </form>
    <ul class="dashboard-details__list">
      <li v-for="note in notes" :key="note.id">
        <h4>{{ note.title }}</h4>
        <p>{{ note.description }}</p>
        <small>Created: {{ formatted(note.createdAt) }}</small>
      </li>
    </ul>
  </article>
</template>

<script>
import { CButton, CInput } from 'mfe-components';

export default {
  name: 'DashboardDetails',
  components: {
    CButton,
    CInput
  },
  props: {
    sharedUtils: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        title: '',
        description: ''
      },
      notes: [
        {
          id: 1,
          title: 'Sprint Planning',
          description: 'Coordinate with the shell team on login flows.',
          createdAt: new Date().toISOString()
        }
      ]
    };
  },
  methods: {
    addNote() {
      if (!this.form.title) {
        return;
      }

      this.notes.push({
        id: Date.now(),
        title: this.form.title,
        description: this.form.description,
        createdAt: new Date().toISOString()
      });

      this.form.title = '';
      this.form.description = '';
    },
    formatted(value) {
      return this.sharedUtils.formatDate
        ? this.sharedUtils.formatDate(value)
        : value;
    }
  }
};
</script>

<style scoped>
.dashboard-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

form {
  display: grid;
  gap: 1rem;
}

.dashboard-details__list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.dashboard-details__list li {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
}

small {
  color: #6b7280;
}
</style>
