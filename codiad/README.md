# IDE

## Prerequisite
- docker
- make

## How to run locally?

``` sh
make build
mkdir /tmp/ide-ws
docker run -e USER_EMAIL=youremail@company.com --privileged -d -v /tmp/ide-ws:/usr/share/nginx/www/_ -p 10000:8080 google/codiad
```

If you are running this on your local workstation then in order to access the ide try the following url:

http://localhost:10000/

However, if you are running this from inside the IDE in the cloud try the following url:

https://codiad-dot-<your-project>.appspot.com/p/10000/
