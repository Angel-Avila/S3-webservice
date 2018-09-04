var express = require('express');
var router = express.Router();
var aws = require('aws-sdk');
var s3 = new aws.S3();
var async = require('async');

var fileUpload = require('express-fileupload');
router.use(fileUpload());


router.get('/', function(req, res) {
  s3.listBuckets({},function(err,data) {
      if(err) {
          throw err;
      }
      console.log(data);
      res.render('listBuckets', { buckets: data.Buckets});
  });
});

router.get('/:bucket/', function(req, res) {

    var bucketName = req.params.bucket;

    var params = {
        Bucket: bucketName,
        MaxKeys: 10
    };

    s3.listObjects(params, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log(data);
            res.render('listObjects', {bucket: bucketName, objects: data.Contents});
        }
    });
    
});

router.get('/:bucket/:key', function(req, res) {
    
    var bucketName = req.params.bucket;
    var objectKey = req.params.key;

    var params = {
        Bucket: bucketName,
        Key: objectKey
    };

    var fileStream = s3.getObject(params).createReadStream();
    fileStream.pipe(res);
});


router.post('/', function(req,res) {
    var params = {
        Bucket: "cloudbucket-iteso",
        CreateBucketConfiguration: {
            LocationConstraint: 'us-east-2'
        }
    };
    
    s3.createBucket(params, function(err, data) {
        if(err) {
            if(err.code == 'BucketAlreadyOwnedByYou') {
                console.log("El bucket ya existe");
            } else {
                console.log(err);
            }
        }
    });
});

router.post('/:bucket', function(req,res) {

    var bucketName = req.params.bucket;

    console.log("Something being posted...");
    
    const files = req.files;
    
    async.each(files, function(file) {
        console.log(file.name);

        var params = {
            Bucket: bucketName,
            Key: file.name,
            Body: file.data
        };

        s3.putObject(params, function(err, data) {
            if(err) {
                console.log(err);
            } else {
                console.log('Archivo agregado... ETag:'+data.ETag);
            }
        })
    }, function(err) {
        console.log(err);
    });

    res.send('');     
});

module.exports = router;
