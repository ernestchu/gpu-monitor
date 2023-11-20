# wget https://nodejs.org/dist/v14.21.1/node-v14.21.1-linux-x64.tar.gz
# wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# npm install -g forever
# forever start -c bash run-this-on-every-node.sh
SERVER="0.0.0.0:3000/"
eval "$(conda shell.bash hook)"
conda create -y -n gpuweb python=3.8 gpustat curl
conda activate gpuweb
watch -n1 "gpustat --json | curl -H 'Content-Type: application/json' -X POST --data-binary @- $SERVER"
