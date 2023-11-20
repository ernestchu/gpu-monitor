<script setup>
import { reactive, ref, computed, watch } from 'vue'

/* ################################# */
/* #  Authentication */
/* ################################# */
function verify() {
  fetch(`//${import.meta.env.VITE_BACKEND}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      'user': auth.user,
      'password': auth.isCache ? auth.password : sha256(auth.password)
    }),
  }).then(res => {
    auth.ok = res.ok
    if (auth.ok && !auth.isCache) {
      // if it's not from cache, cache it!
      localStorage.setItem('auth', JSON.stringify({
        'user': auth.user,
        'password': sha256(auth.password),
        'timestamp': Date.now()
      }))
    } else {
      auth.message = 'Authentication Failed'
    }
  })
}

let authCache = localStorage.getItem('auth')
if (authCache) {
  authCache = JSON.parse(authCache)
}
// check if cache expired
if (authCache && (Date.now() - authCache.timestamp) > import.meta.env.VITE_SESSION_DURATION) {
  localStorage.removeItem('auth')
  authCache = null
}

const auth = reactive({
  ok: authCache !== null,
  user: authCache ? authCache.user : '',
  password: authCache ? authCache.password : '',
  isCache: authCache !== null,
  message: '',
})

if (authCache) {
  verify()
}


/* ################################# */
/* #  UI */
/* ################################# */
/* collapse each node for a cleaner ui */
const numTimeout = reactive([])
const collapseControl = reactive([])
function toggleCollapse (index) {
  collapseControl[index] = !collapseControl[index]
}

/* dark mode & accent colors */
const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
  isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
})
const accentColors = {
  'light': [
    '#CEE6BF',
    '#F6D6B3',
    '#D4ABC1',
    '#D7BFDB',
    '#B1D0FF',
  ],
  'dark': [ 
    '#556A49',
    '#785C3F',
    '#774E63',
    '#624D65',
    '#3E5780',
  ]
}
function getColorByUser (user) {
  const idx = gpustats.users.indexOf(user)
  const colors = accentColors[isDarkMode.value ? 'dark' : 'light']
  return colors[idx % colors.length]
}
function getActiveIndicatorStyle (user) {
  const idx = gpustats.users.indexOf(user)
  const colors = accentColors[isDarkMode.value ? 'dark' : 'light']
  const c = colors[idx % colors.length]
  return { background: `linear-gradient(to right, ${c}, ${pSBC(isDarkMode.value ? 0.05 : -0.1, c)} 50%, ${c})` }
}

/* ################################# */
/* #  Data */
/* ################################# */
/* main data */
const gpustats = reactive({ data: null, users: [] })
let lastSeensPrev = null

/* update data with backend every 1 sec */
setInterval(() => {
  fetch(`//${import.meta.env.VITE_BACKEND}`)
    .then(response => response.json())
    .then(data => {
      data = Object.keys(data).sort().reduce(
        (obj, key) => { 
          obj[key] = data[key]; 
          return obj;
        },{})
      gpustats.data = data
      while (collapseControl.length < Object.keys(data).length) {
        collapseControl.push(false)
      }
      while (numTimeout.length < Object.keys(data).length) {
        numTimeout.push(false)
      }
      /* parse unique users */
      let users = Object.values(gpustats.data)
                    .map(d => d.gpus).flat()
                    .map(d => d.processes).flat()
                    .map(d => d.username)
      users = [...new Set(users)]
      const leftUsers = gpustats.users.filter(x => !users.includes(x))
      const newUsers = users.filter(x => !gpustats.users.includes(x))
      /* remove left users */
      gpustats.users = gpustats.users.filter(x => !leftUsers.includes(x))
      /* add new users */
      gpustats.users = gpustats.users.concat(newUsers)

      const lastSeens = []
      Object.values(gpustats.data).forEach(data => {
        lastSeens.push(data.query_time)
      })
      if (lastSeensPrev !== null &&
          lastSeensPrev.length === lastSeens.length) {
          lastSeensPrev.forEach((prev, index) => {
            if (prev === lastSeens[index]) {
              numTimeout[index]++
            } else { numTimeout[index] = 0 }
          })
      }
      lastSeensPrev = lastSeens
    })
}, 1000)

/* parse unique user in a single node */
function parseUsersPerNode (node) {
  let users = node.gpus
                .map(g => g.processes).flat()
                .map(p => p.username)
  users = [...new Set(users)]
  return users
}

</script>

<template>
  <h1>AIIU GPU Monitor 🖥</h1>
  <hr>
  <div v-if="!auth.ok">
    <input @keyup.enter="verify" v-model="auth.user" placeholder="Username" type="text" />
    <input @keyup.enter="verify" v-model="auth.password" placeholder="Password" type="password" />
    <button @click="verify">Submit</button>
    {{ auth.message }}
  </div>
  <div v-if="auth.ok && gpustats.data" class="gpu-board">
    <div v-for="(node, _, index) in gpustats.data">
      <h2>
        {{ node.hostname }}: {{ node.ip.substr(7) }}
        <span v-if="numTimeout[index] > 10">🚧</span>
        <span class="btn" v-if="collapseControl[index]" @click="toggleCollapse(index)">[-]</span>
        <span class="btn" v-else @click="toggleCollapse(index)">[+]</span>
        <span class="user"
              v-for="user in parseUsersPerNode(node)"
              :style="{'background-color': getColorByUser(user)}"
              @click="toggleCollapse(index)">{{ user }}</span>
      </h2>
      <template v-if="collapseControl[index]">
      Last seen: {{ node.query_time.split('T').join(' ') }}
      <div class="gpu" v-for="gpu in node.gpus">
        {{ gpu.index }}, {{ gpu.name }},
        {{ gpu['temperature.gpu'] }}°C,
        {{ gpu['utilization.gpu'] }}%,
        {{ gpu['memory.used'] }} / {{ gpu['memory.total'] }} MB
        <div class="proportion">
        <template v-if="gpu.processes.length">
          <div
            v-for="proc in gpu.processes.sort((a, b) => b.gpu_memory_usage - a.gpu_memory_usage)"
            :style="{
              'width': `${proc.gpu_memory_usage / gpu['memory.total'] * 100}%`,
              'background-color': getColorByUser(proc.username)
             }"
          >
            <div
              v-if="gpu['utilization.gpu'] != 0"
              class="active-indicator"
              :style="getActiveIndicatorStyle(proc.username)"
            ></div>
            <span>
              {{ `${proc.gpu_memory_usage / gpu['memory.total'] * 100}`.substr(0, 5) + '% ' + `${proc.username}` }}
            </span>
          </div></template>
        </div>
        <ul v-if="gpu.processes.length">
          <li v-for="proc in gpu.processes.sort((a, b) => b.gpu_memory_usage - a.gpu_memory_usage)">
            {{ proc.username }}
            {{ proc.gpu_memory_usage }} MB
          </li>
        </ul>
      </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
h2 span.btn {
  color: green;
}
h2 span:hover {
  cursor: pointer;
}
h2 span.user {
  font-size: 12pt;
  padding: 1px 5px;
  margin: 0 3px;
  border: 1px solid;
  border-radius: 5px;
}
.gpu {
  margin-bottom: 20px;
}

.proportion {
  border: .5px solid;
  border-radius: 5px;
  overflow: hidden;
  height: 30px;
}
.proportion > div {
  height: 100%;
  display: inline-block;
  overflow: hidden;
  padding-right: 3px;
  transition: all .5s;
  border-radius: 5px;
  margin: 0 1px 0 0;
  position: relative;
}
.proportion > div > span {
  position: absolute;
  right: 1%;
}

.active-indicator {
  position: absolute;
  height: 100%;
  width: 15%;
  animation-name: flow;
  animation-duration: 4s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
@keyframes flow {
  0% {
    left: -20%;
  }
  80% {
    left: 120%;
  }
  100% {
    left: 120%;
  }
}

</style>
