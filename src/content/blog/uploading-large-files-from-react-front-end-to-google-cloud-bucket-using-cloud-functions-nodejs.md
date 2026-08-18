---
title: "Uploading large files from React front end to Google cloud bucket using cloud functions — NodeJS &…"
date: "2024-01-02"
preview: "Hi Guys, Uploading files from a React front end to a storage bucket is a very common requirement in many applications. Most of the time we…"
description: "Uploading large files from a React front end straight into a Google Cloud Storage bucket using signed URLs and Cloud Functions."
tags: ["gcp", "react", "nodejs"]
mediumUrl: "https://medium.com/@billacode/uploading-large-files-from-react-front-end-to-google-cloud-bucket-using-cloud-functions-nodejs-c63da86874d5"
---
Hi Guys, Uploading files from a React front end to a storage bucket is a very common requirement in many applications. Most of the time we come across instances where we need to upload something like an image of a user or product. So as the first part let’s see how to upload a file from React front end to a Google bucket using cloud storage library methods.

![Uploading large files from React front end to Google cloud bucket using cloud functions — NodeJS &… — figure 1](./images/uploading-large-files-from-react-front-end-to-google-cloud-bucket-using-cloud-functions-nodejs/1.png)

First I will create a component in react to upload images. Following is the code.

```typescript
import React, { useState } from "react";

const VideoUploader = () => {
  const uploadFile = async (file) => {
    const formData = new FormData();

    formData.append('file', file);
    const response = await fetch(
      `http://localhost:5001/project_name/region/cloud_function/v1/upload/file/`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.ok) {
      console.log('File uploaded successfully');
    } else {
      console.error('Error uploading file');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    await uploadFile(file);
  };
  
  return (
    <input
      type="file"
      onChange={handleFileChange}
    />
  );
};

export default VideoUploader;
```

So this does a very simple task. It take an input as a file and then using a cloud function end point it upload the image. If everything works correctly we will get a popup saying “File uploaded successfully”.

Now let’s look at the Cloud function code.

```typescript
import * as express from "express";
import * as cors from "cors";
const formidable = require("formidable-serverless");
const { Storage } = require("@google-cloud/storage");
import { HttpsFunction, onRequest } from "firebase-functions/v2/https";

const app = express();
app.use(cors());

const storage = new Storage();
const bucket = storage.bucket("test-bucket");

app.post("/v1/upload/file/", async (req, res, next) => {
  try {
    const form = formidable();

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        next(err);
        return;
      }

      const file = files.file;
      const fileName = file.name;
      const folderName = fileName.split('.')[0];

      await bucket.upload(file.path, {
        destination: `${folderName}/${file.name}`,
      });
      res.status(200).json({ fields, files });
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Internal Server Error");
  }
});

const cloudFunctionTest: HttpsFunction = onRequest(app);
module.exports = cloudFunctionTest;
```

Now you might think file send from React front end could be easily uploaded to GCP bucket using a simple express endpoint. But you are wrong, unlike a simple express server, in Google cloud functions v2, underlying C**loud Run platform **read your request first and it gives an error saying boundry is not defined. So the easiest fix is to use this library called **formidable-serverless**. Using this we can avoid changing client app to send boundry values and other configs.

## **Uploading large files**

Now the above way of uploading files is not a problem for small files, but cloud run has a limit for request payload size and it’s small as **32mb**. Now if my file is a large one, then we have to think of another way to do this. So the alternative way to avoid 32mb limit is to use **signed URLs** for file uploading.

```typescript
async function generateV4SignedPolicy(fileName: string) {
  const folderName = fileName.split('.')[0];
  const file = bucket.file(`${folderName}/${fileName}`);

  // These options will allow temporary uploading of a file
  // through an HTML form.
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 120 * 60 * 1000, // 2 hours
  };

  // Get a v4 signed policy for uploading file
  const [response] = await file.generateSignedPostPolicyV4(options);
  return response;
}
```

Using this function, you can get a signed URL and other parameters to upload your larger file. Here I have make the URL to be active for 2 hours. Let’s create a new endpoint to give us the signed URL.

```
app.get("/v1/get/signedUploadUrl/:fileName", async (req, res) => {
  const fileName = req.params.fileName;
  const out = await generateV4SignedPolicy(fileName);
  res.send(out);
});
```

You should have a service account for this to work.

Now the cloud function code would change a bit. You create a service account as mentioned in the above guide and then go to keys section in service account and create this JSON file. Add it to root of your functions and use it like this.

```
const storage = new Storage({
  keyFilename: "./service-account.json",
});
const bucket = storage.bucket("test-bucket");
```

Apart from this, By using **gsutils**, try to add access headers for the GCP bucket. In **cloud shell** enter following.

```
printf '[{"origin": ["*"],"responseHeader": ["*"],"method":
["GET","POST","HEAD"],"maxAgeSeconds": 86400}]' > cors.json

gsutil cors set cors.json gs://<bucket_name>
```

Now we have a way to get the signed URL parameters for GCP bucket. So let’s move to React component changes.

```typescript
import React, { useState } from "react";

const VideoUploader = () => {
  const [signedForm, setSignedForm] = useState(null);

  const uploadVideo = async (file) => {
    const response = await fetch(n
      `http://localhost:5001/project_name/region/cloud_function/v1/get/signedUploadUrl/${file.name}`
    );

    if (response.status !== 200) {
      throw response.status;
    }

    const responseJSON = await response.json();
    setSignedForm(responseJSON);
  };

  const handleVideoChange = async (event) => {
    const file = event.target.files[0];
    await uploadVideo(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData =  new FormData(event.target);
    try {
      await fetch(
        `${signedForm.url}`,
        {
          method: "POST",
          mode: 'no-cors',
          body: formData,
        }
      );

      alert('Video upload successful !!!');
    } catch (e) {
      console.log(e);
      alert('error when uploading video');
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {signedForm && Object.keys(signedForm.fields).map((name) => (
          <input
            key={name}
            type="hidden"
            name={name}
            value={signedForm.fields[name]}
          />
        ))}
        <input type="file" name="file" onChange={handleFileChange} /><br/>
        <input type={signedForm ? "submit" : "hidden"} value="Upload File" />
      </form>
    </div>
  );
};

export default VideoUploader;
```

What we do here is we first show only the file input section and when user upload file it will call **handleFileChange** method. Now we get the file name and using it we request the **signed URL** parameters from **cloud function**. Using that response we fill out the form data and we show a new button called **upload file**. When user click on it, it will call the **handleSubmit** method. Now using a **POST request** we send all the **form data** filled out using the **signed URL response** to the signed URL. Any big file can be uploaded using this.

In request configs **mode** should be **no-cors**, if not you will be get an **CORS error** even though you have set CORS in GCP bucket to allow all origins.

So this is the implementation of file upload to GCP bucket from a react front end and cloud function. Let me know if you have any problems.

Happy Coding :P
