FROM containers.intersystems.com/intersystems/iris-community:latest-em

USER root

RUN wget https://deb.nodesource.com/setup_20.x -qO -  | bash; apt-get install nodejs -y

COPY package.json /home/irisowner/typeorm-iris/package.json
COPY package-lock.json /home/irisowner/typeorm-iris/package-lock.json

RUN mkdir -p /home/irisowner/typeorm-iris/node_modules && \
    mkdir -p /home/irisowner/typeorm-iris/build && \
    chown -R 51773:51773 /home/irisowner/typeorm-iris

USER 51773

ENV PATH=./node_modules/.bin:${PATH}

RUN cd /home/irisowner/typeorm-iris && ls -la . && \
    npm install
