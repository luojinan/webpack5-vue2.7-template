<template>
  <div id="app">
    app {{ count }}
    <button @click="addCount">add</button>
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'App',

  setup () {
    const count = ref(0)
    function addCount () {
      count.value++
    }
    return {
      count,
      addCount
    }
  }
}
</script>
