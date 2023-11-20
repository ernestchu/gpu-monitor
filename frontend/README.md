# GPU Monitor Frontend

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

- Specify the IP address of the backend by modifying `VITE_BACKEND=0.0.0.0:3000` in [.env](.env)
- The main implementation can be found at [src/components/GPUBoard.vue](src/components/GPUBoard.vue).

### Compile and Minify for Production

```sh
npm run build
```

Further details can be found at [Vite](https://vitejs.dev) and [Vue.js](https://vuejs.org).
