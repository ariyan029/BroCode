<template>
  <div class="container">
    <h1>💚 Vue 3 Starter on VibeCode</h1>
    <p>Powered by Vite and in-browser WebContainers.</p>
    <button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>

<style>
body {
  margin: 0;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.container {
  text-align: center;
  background: #1e293b;
  padding: 2.5rem;
  border-radius: 12px;
}
h1 {
  color: #42b883;
}
button {
  background: #42b883;
  color: #0f172a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}
</style>
