import * as common from "oci-common";
import * as identity from "oci-identity";

async function createOCIAccount(
  config,
  compartmentName,
  compartmentDescription
) {
  //debug

  console.log("Creating Compartment", compartmentName, compartmentDescription);

  // Create a provider using parameterized credentials
  const provider = new common.SimpleAuthenticationDetailsProvider(
    config.tenancyId,
    config.userId,
    config.fingerprint,
    config.privateKey,
    config.passphrase,
    config.region
  );

  try {
    // Debug log for configuration
    console.log("Config:", config);

    // Create a provider using parameterized credentials
    const provider = new common.SimpleAuthenticationDetailsProvider(
      config.tenancyId,
      config.userId,
      config.fingerprint,
      config.privateKey,
      config.passphrase
    );

    // Debug log for provider
    console.log("Provider created successfully.");

    // Ensure the region is correctly set using the Region enum
    const region = common.Region.fromRegionId(config.region);

    // Debug log for region
    console.log("Region:", region);

    // Create an IdentityClient
    const identityClient = new identity.IdentityClient({
      authenticationDetailsProvider: provider,
    });

    // Set the region for the client
    identityClient.region = region;

    // Debug log for client setup
    console.log("IdentityClient created successfully and region set.");

    // Define the new compartment details
    const createCompartmentDetails = {
      compartmentId: config.tenancyId,
      name: compartmentName,
      description: compartmentDescription,
    };

    // Debug log for compartment details
    console.log("Compartment details:", createCompartmentDetails);

    // Create the new compartment
    const createCompartmentRequest = {
      createCompartmentDetails: createCompartmentDetails,
    };
    const response = await identityClient.createCompartment(
      createCompartmentRequest
    );

    console.log("Compartment created successfully:", response.compartment);
    return response;
  } catch (err) {
    if (err.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error("Response error:", err.response.data);
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.error("No response received:", err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error in request setup:", err.message);
    }
    console.error("Config:", err.config);
  }
}

async function createOCIEnv({ config, environs, orgCode, appCode }) {
  try {
    // console.log("entered OCI createOCIenv");
    // console.log("config", config);
    // console.log("environs", environs);
    // console.log("orgcode", orgCode);
    // console.log("appcode", appCode);

    // return;
    let environments = [];

    await Promise.all(
      environs.map(async (env) => {
        let compartmentName = `bp-${orgCode.split("-")[0]}-${
          appCode.split("-")[0]
        }-${env}`;

        let compartmentDescription = `Compartment for ${appCode}`;

        const accountId = await createOCIAccount(
          config,
          compartmentName,
          compartmentDescription
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

async function getOCIAccess({ config, environs, orgCode, appCode }) {
  // Yet to be implemented @Lewis Sheridan 4-July-2024
}

async function getOCIPolicies({ config, environs, orgCode, appCode }) {
  // Yet to be implemented @Lewis Sheridan 4-July-2024
}

async function getOCICost({ cloudCredentials, environments }) {
  const cost = ((Math.random() + 1) * 500).toFixed(2);
  return cost; // Simulating App Cost for MVP
}

export { getOCIAccess, getOCICost, getOCIPolicies, createOCIEnv };
