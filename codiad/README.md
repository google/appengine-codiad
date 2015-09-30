# IDE

## Prerequisite
- docker
- make

## How to run locally?

``` sh
make build
export DATA_VOLUME=/tmp/ide-ws
mkdir -p ${DATA_VOLUME}
docker run -e USER_EMAIL=youremail@company.com --privileged -d \
  -v ${DATA_VOLUME}:/usr/share/nginx/www/_ -p 10000:8080 google/codiad
```

If you are running this on your local workstation then in order to access the ide try the following url:

http://localhost:10000/

However, if you are running this from inside the IDE in the cloud try the following url:

https://codiad-dot-<your-project>.appspot.com/p/10000/

Caveats of running locally:
- There will be no authentication on the running Codiad instance.
- There will be no data backups. The data will be stored on the host machine(e.g. Your workstation).
- The data written by Codiad will be written with `root`'s user.
