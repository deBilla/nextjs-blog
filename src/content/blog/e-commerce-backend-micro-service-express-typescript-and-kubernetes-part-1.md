---
title: "E-Commerce backend (Micro-service) — Express, Typescript and Kubernetes (Part 1)"
date: "2024-01-11"
preview: "Hi Guys, This is a new tutorial series on creating a e-commerce backend using Express and Kubernetes. In this tutorial we will just create…"
description: "Part one of an e-commerce microservice backend: a single Express and TypeScript service, containerised and running on Kubernetes."
tags: ["kubernetes", "nodejs", "docker"]
mediumUrl: "https://medium.com/@billacode/e-commerce-backend-micro-service-express-typescript-and-kubernetes-part-1-31b4c3ee2b47"
---
Hi Guys, This is a new tutorial series on creating a e-commerce backend using Express and Kubernetes. In this tutorial we will just create only one dummy express server and then try to deploy it with kubernetes and test.

![E-Commerce backend (Micro-service) — Express, Typescript and Kubernetes (Part 1) — figure 1](./images/e-commerce-backend-micro-service-express-typescript-and-kubernetes-part-1/1.png)

**You should have Node:18 and Docker installed in your local environment.**

First create an empty folder named product-service inside your project folder and inside it run this command.

```bash
npm init -y
```

After you give basic details about the project, it will create a package.json file. Now run the following command.

```bash
npm install express typescript ts-node @types/express
```

Now to configure typescript run the following command

```bash
npx tsc --init
```

This will create a file named tsconfig.json. Let’s configure it later. Next step is to create a folder named src and inside it create a file named app.ts.

```typescript
import express from 'express';
```

```
const app = express();
const port = process.env.PORT || 3000;
```

```
app.get('/', (req, res) => {
  res.send('Hello, This is Price Service!');
});
```

```
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

This is a very simple Express App. Now let’s run and test this.

```bash
npx ts-node src/app.ts
```

This will this app. And if you go to the [http://localhost:3000/](http://localhost:3000/) you will see the message **‘Hello, This is Price Service!’**. Now the other way we can run this is by first compiling the ts code and then run the compiled file.

```
tsc && node app.js
```

But having the compiled build files inside the source folder is messy. Go to the `tsconfig.json` file and add `"outDir": "./dist”` inside it. This will put all the compiled files inside a folder named `dist`.

Now let’s configure `package.json` file. Inside the scripts add scripts for build and run.

```json
{
  "name": "kubernetes-express-test",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "tsc && node dist/app.js",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@types/express": "^4.17.17",
    "express": "^4.18.2",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

Next step is to create the Dockerfile.

```css
# Use an official Node.js runtime as a parent image
FROM node:20-alpine
```

```
# Set the working directory inside the container
WORKDIR /usr/src/app
```

```
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
```

```
# Install application dependencies
RUN npm install
```

```
# Copy the rest of the application code to the working directory
COPY . .
```

```
# Build the TypeScript code
RUN npm run build
```

```
# Expose the port that your application will run on
EXPOSE 3000
```

```
# Define the command to run your application
CMD ["node", "dist/app.js"]
```

Now we have a dummy express server with a Dockerfile. Let’s test this out using docker. Run the following command.

```bash
docker build -t test-service .
```

After this is finished Run the following

```bash
docker run -p 3000:3000 test-service
```

Go and check the [http://localhost:3000/](http://localhost:3000/) you should see the same message you saw before. Now most of our work is done. Remaining is to deploy this to a Kubernetes cluster. For this we need Kubernetes installed in our local environment. The easiest options is to use MiniKube.

Run the **minikube start **command and then check the status wuing **minikube status.**

Now create kubernetes deployment files in a folder named kubernetes. We need to create 2 yaml files for this. One is to describe the deployment and other one is for service description.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
        - name: product-service-container
          image: <USER_NAME>/node-product-service-test
          ports:
            - containerPort: 3000
```

Service description file

```yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

Now if you check the deployment file, you can see I have put **image: <USER_NAME>/node-product-service-test**. What this means is I’m accessing the docker image of my product-service from here. To access a docker image from docker hub first you should push it to docker hub.

For this you have to create a [dockerhub account](https://hub.docker.com/) and then log in to it using terminal. Then enter the following commands

```bash
docker login
```

```bash
docker build -t <USER_NAME>/node-product-service-test
```

```bash
docker push <USER_NAME>/node-product-service-test
```

Now run the following commands to add these configurations to kubernetes.

```bash
kubectl apply -f kubernetes/product-service-deployment.yaml
```

```bash
kubectl apply -f kubernetes/product-service.yaml
```

Now deploy the product-service to kubernetes cluster using following command.

```
minikube service product-service
```

Now this will open a tab in you browser and show the message you saw previously.

In the next tutorials We will look deeply in to more complex concepts.

Github: [https://github.com/deBilla/kubernetes-test-node-express](https://github.com/deBilla/kubernetes-test-node-express)

Happy Coding !!!! :PE-Commerce backend (Micro-service) — Express, Typescript and Kubernetes (Part 1)

Hi Guys, This is a new tutorial series on creating a e-commerce backend using Express and Kubernetes. In this tutorial we will just create only one dummy express server and then try to deploy it with kubernetes and test.

![E-Commerce backend (Micro-service) — Express, Typescript and Kubernetes (Part 1) — figure 1](./images/e-commerce-backend-micro-service-express-typescript-and-kubernetes-part-1/1.png)

**You should have Node:18 and Docker installed in your local environment.**

First create an empty folder named product-service inside your project folder and inside it run this command.

```bash
npm init -y
```

After you give basic details about the project, it will create a package.json file. Now run the following command.

```bash
npm install express typescript ts-node @types/express
```

Now to configure typescript run the following command

```bash
npx tsc --init
```

This will create a file named tsconfig.json. Let’s configure it later. Next step is to create a folder named src and inside it create a file named app.ts.

```typescript
import express from 'express';
```

```
const app = express();
const port = process.env.PORT || 3000;
```

```
app.get('/', (req, res) => {
  res.send('Hello, This is Price Service!');
});
```

```
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

This is a very simple Express App. Now let’s run and test this.

```bash
npx ts-node src/app.ts
```

This will this app. And if you go to the [http://localhost:3000/](http://localhost:3000/) you will see the message **‘Hello, This is Price Service!’**. Now the other way we can run this is by first compiling the ts code and then run the compiled file.

```
tsc && node app.js
```

But having the compiled build files inside the source folder is messy. Go to the `tsconfig.json` file and add `"outDir": "./dist”` inside it. This will put all the compiled files inside a folder named `dist`.

Now let’s configure `package.json` file. Inside the scripts add scripts for build and run.

```json
{
  "name": "kubernetes-express-test",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "tsc && node dist/app.js",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@types/express": "^4.17.17",
    "express": "^4.18.2",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

Next step is to create the Dockerfile.

```css
# Use an official Node.js runtime as a parent image
FROM node:20-alpine
```

```
# Set the working directory inside the container
WORKDIR /usr/src/app
```

```
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
```

```
# Install application dependencies
RUN npm install
```

```
# Copy the rest of the application code to the working directory
COPY . .
```

```
# Build the TypeScript code
RUN npm run build
```

```
# Expose the port that your application will run on
EXPOSE 3000
```

```
# Define the command to run your application
CMD ["node", "dist/app.js"]
```

Now we have a dummy express server with a Dockerfile. Let’s test this out using docker. Run the following command.

```bash
docker build -t test-service .
```

After this is finished Run the following

```bash
docker run -p 3000:3000 test-service
```

Go and check the [http://localhost:3000/](http://localhost:3000/) you should see the same message you saw before. Now most of our work is done. Remaining is to deploy this to a Kubernetes cluster. For this we need Kubernetes installed in our local environment. The easiest options is to use MiniKube.

Run the **minikube start **command and then check the status wuing **minikube status.**

Now create kubernetes deployment files in a folder named kubernetes. We need to create 2 yaml files for this. One is to describe the deployment and other one is for service description.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
        - name: product-service-container
          image: <USER_NAME>/node-product-service-test
          ports:
            - containerPort: 3000
```

Service description file

```yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

Now if you check the deployment file, you can see I have put **image: <USER_NAME>/node-product-service-test**. What this means is I’m accessing the docker image of my product-service from here. To access a docker image from docker hub first you should push it to docker hub.

For this you have to create a [dockerhub account](https://hub.docker.com/) and then log in to it using terminal. Then enter the following commands

```bash
docker login
```

```bash
docker build -t <USER_NAME>/node-product-service-test
```

```bash
docker push <USER_NAME>/node-product-service-test
```

Now run the following commands to add these configurations to kubernetes.

```bash
kubectl apply -f kubernetes/product-service-deployment.yaml
```

```bash
kubectl apply -f kubernetes/product-service.yaml
```

Now deploy the product-service to kubernetes cluster using following command.

```
minikube service product-service
```

Now this will open a tab in you browser and show the message you saw previously.

In the next tutorials We will look deeply in to more complex concepts.

Github: [https://github.com/deBilla/kubernetes-test-node-express](https://github.com/deBilla/kubernetes-test-node-express)

Happy Coding !!!! :P
