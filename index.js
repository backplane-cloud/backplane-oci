// import asyncHandler from "express-async-handler";
// import OCI from "oci-sdk";

const common = require("oci-common");
const identity = require("oci-identity");

async function createCompartment(
  config,
  compartmentName,
  compartmentDescription
) {
  // Create a provider using parameterized credentials
  const provider = new common.SimpleAuthenticationDetailsProvider(
    config.tenancyId,
    config.userId,
    config.fingerprint,
    config.privateKey,
    config.passphrase
  );

  // Create an IdentityClient
  const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: provider,
  });

  try {
    // Get the current user's tenancy
    const tenancyRequest = { tenancyId: config.tenancyId };
    const tenancyResponse = await identityClient.getTenancy(tenancyRequest);
    const tenancyId = tenancyResponse.tenancy.id;

    // Define the new compartment details
    const createCompartmentDetails = {
      compartmentId: tenancyId,
      name: compartmentName,
      description: compartmentDescription,
    };

    // Create the new compartment
    const createCompartmentRequest = {
      createCompartmentDetails: createCompartmentDetails,
    };
    const response = await identityClient.createCompartment(
      createCompartmentRequest
    );

    console.log("Compartment created successfully:", response.compartment);
  } catch (err) {
    console.error("Error creating compartment:", err);
  }
}

async function createOCIAccount(
  accessKeyId,
  secretAccessKey,
  accountName,
  emailAddress
) {
  try {
    // Set up OCI credentials
    const credentials = new OCI.Credentials({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    });

    // Set a default region in the global OCI configuration
    OCI.config.update({ region: "us-east-1" });

    // Set up OCI service objects
    const organizations = new OCI.Organizations({
      credentials: credentials,
    });

    // Create OCI account
    const createAccountParams = {
      AccountName: accountName,
      Email: emailAddress,
      // RoleName: "OrganizationAccountAccessRole", // Optional: specify a custom IAM role for the account
    };
    const createAccountResponse = await organizations
      .createAccount(createAccountParams)
      .promise();
    console.log("OCI account created successfully:", createAccountResponse);
    return createAccountResponse.CreateAccountStatus.AccountName;
  } catch (err) {
    console.error("Error creating OCI account:", err);
    throw err;
  }
}

async function createOCIEnv({
  environs,
  orgCode,
  appCode,
  accessKeyId,
  secretAccessKey,
  emailAddress,
}) {
  try {
    let environments = [];

    await Promise.all(
      environs.map(async (env) => {
        let accountName = `bp-${orgCode.split("-")[0]}-${
          appCode.split("-")[0]
        }-${env}`;
        const accountId = await createOCIAccount(
          accessKeyId,
          secretAccessKey,
          accountName,
          emailAddress
        );

        environments.push(accountId);
      })
    );
    // console.log("environments", environments);
    return environments;
    // res.status(200).json(environments);
  } catch (error) {
    console.error("Error creating OCI environments:", error);
    // res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getOCIAccess({ accessKeyId, secretAccessKey, environments }) {
  // Create IAM service object
  const iam = new OCI.IAM();
  OCI.config.update({
    accessKeyId,
    secretAccessKey,
    region: "eu-west-2",
  });
  let accessAssignments = [];

  try {
    await Promise.all(
      environments.map(async (env) => {
        // Get IAM user details
        const { Users } = await iam.listUsers().promise();
        // const users = Users; //Users.filter((user) => user.Arn.includes(env));

        // Extract access details from the user(s)
        // const accessDetails = users.map((user) => {
        //   return {
        //     UserName: user.UserName,
        //     UserId: user.UserId,
        //     AccessKeys: user.AccessKeys,
        //   };
        // });
        accessAssignments.push({
          environment: env,
          assignments: Users,
        });
      })
    );
  } catch (error) {
    console.error("Error retrieving OCI access for environment:", error);
    // Push a placeholder object to maintain the structure of the results array
    accessAssignments.push({ environment: env, assignments: console.error });
  }

  return accessAssignments;
}

async function getOCIPolicies({ accessKeyId, secretAccessKey, environments }) {
  // Set the OCI region
  OCI.config.update({ region: "us-east-1" }); // Need to parameterise this on environments

  // Create an Organizations service object
  const organizations = new OCI.Organizations();

  try {
    // Get SCPs for the organization
    const response = await organizations
      .listPolicies({ Filter: "SERVICE_CONTROL_POLICY" })
      .promise();

    // Extract SCPs from the response
    const scps = response.Policies;

    return scps;
  } catch (error) {
    console.error("Error retrieving OCI Service Control Policies:", error);
    return null;
  }
}

async function getOCICost({ cloudCredentials, environments }) {
  const cost = ((Math.random() + 1) * 500).toFixed(2);
  return cost; // Simulating App Cost for MVP
}

export { getOCIAccess, getOCICost, getOCIPolicies, createOCIEnv };
