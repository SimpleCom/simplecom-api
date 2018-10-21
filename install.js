// Notes for setup/creating an install script

const aws = require('aws-sdk');

aws.config.update({
  accessKeyId:     process.env.AWS_ACCESS,
  secretAccessKey: process.env.AWS_SECRET,
  region:          process.env.AWS_REGION,
});


// Creates Lambda Function Policy which must be created once for each Lambda function before calling s3.putBucketNotificationConfiguration(...)
function createLambdaPermission() {
  const lambda = new aws.Lambda();

  const params = {
    Action:        'lambda:InvokeFunction',
    FunctionName:  process.env.AWS_LAMBDA_ARN,
    Principal:     's3.amazonaws.com',
    SourceAccount: process.env.AWS_ACCOUNT_ID,
    StatementId:   `${AWS_LAMBDA_FUNCTION_NAME}-user-data-bucket-permission`,
  };
  lambda.addPermission(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
}
