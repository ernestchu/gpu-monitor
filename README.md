# GPU Monitor

This project consists of three components:
```txt
🖥️ monitor server
│               ┌─────  🖥️ GPU node 0 | run-this-on-every-node.sh
├── backend < ──┼─────  🖥️ GPU node 1 | run-this-on-every-node.sh
│      │        └─────  🖥️ GPU node 2 | run-this-on-every-node.sh
│      v
└── frontend
       │
       v
user's browerser
```
- [run-this-on-every-node.sh](run-this-on-every-node.sh). This script sends GPU info from a GPU node to the backend of monitor server. All GPU nodes need to run this.
- [backend](backend). This is an Express.js web server which GPU nodes can send their GPU status to. Only the monitor server needs to run this.
- [frontend](frontend). This is a Vue.js web app that presents all GPU info served by the backend in a cool GUI. Only the monitor server needs to run this.

> Note: The aforementioned requirements do not necessitate a dedicated monitor server. Any machine with a static IP address that can be accessed remotely can serve as the monitor server. For instance, one of the GPU nodes could be utilized as the monitor server. Similarly, the backend and frontend components do not need to reside on the same machine, as long as the frontend can establish a connection with the backend.

## Instruction for GPU nodes
> To learn more about [backend](backend) and [frontend](frontend), click on them to check their dedicated READMEs. You are recommended to check them first since the monitor server has to be started before you can send GPU data to it.
### Environment
1. Install [Node.js](https://nodejs.org/)
1. Install [Miniconda](https://docs.conda.io/projects/miniconda/en/latest/)
1. Install [forever](https://www.npmjs.com/package/forever)
### Send GPU info & usage to the monitor server
1. Specify the IP address of the monitor server that runs the backend by modifying `SERVER="0.0.0.0:3000/"` in [run-this-on-every-node.sh](run-this-on-every-node.sh)
1. Run `forever start -c bash run-this-on-every-node.sh` to transmit data every 1 second in background. (You can also use `bash run-this-on-every-node.sh` for debugging purpose. However you need to keep your terminal alive.)


