const express = require('express')
const app = express()
const pdf2img = require('pdf-img-convert');
const Minio = require("minio");
require("dotenv").config();

const minioClient = new Minio.Client({
    endPoint: process.env.ENDPOINT,
    useSSL: false,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY
  });

let minioBucket = process.env.BUCKET_NAME

app.get('/convert', async (req, res) => {
     img_urls = []
     //pdf_url =String('http://www.pdf995.com/samples/pdf.pdf')
     pdf_url=req.query.url
     try {
          pdfArray = await pdf2img.convert(pdf_url);
      } catch (e) {
          return res.status(403).send({
               message: 'Invalid File'
            });
      }
     //console.log("saving");
     for (i = 0; i < pdfArray.length; i++){
          //console.log(pdfArray[i])
          /*fs.writeFile("output"+i+".png", pdfArray[i], function (error) {
               if (error) { console.error("Error: " + error); }
             });*/

          path = "output"+i+".png"
          minioClient.presignedPutObject(minioBucket, path, 5*60, (err, url) => {
          //alert("Wait for 5 Seconds");
          if (err){
                return console.log(err);
            }
            img_urls.push(getUrl(path))
            //console.log(getUrl(path))
        })
     }
     url_json = {"urls":img_urls}
     res.send(url_json)
});

minioClient.bucketExists(minioBucket, function(err) {
     if (err) {
          if (err.code == 'NoSuchBucket') {
               console.log("Bucket doesnt exist")
          }
     }
     const port = process.env.PORT || 3000
          app.listen(port, (err) =>{ 
               if (err) {
               return console.error(err);
          }
          return console.log(`server is listening on ${port}`);
          });

     //console.log('Bucket exists:', minioBucket);
});


getUrl = path => {
     if(!path) return;
     let url;
     minioClient.presignedUrl('GET', minioBucket, path, 1*60*60, function(err, presignedUrl) {
         if (err) return console.log(err)
         // console.log(presignedUrl)
         //console.log("Success")
         url = presignedUrl
       })
     return url;
   }
