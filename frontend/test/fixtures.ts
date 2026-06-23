/** Synthetic HL7 messages for tests and the in-app "load example" button. NO real PHI. */

export const ADT_A01 = [
  "MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP|RECVFAC|20260623120000||ADT^A01|MSG00001|P|2.4",
  "EVN|A01|20260623120000",
  "PID|1||MRN12345^^^HOSP^MR~2950500011^^^AUSHIC^MC||DOE^JANE^Q||19850312|F|||123 MAIN ST^^METROPOLIS^WA^6000^AU",
  "PV1|1|I|WARD^101^A|||||||SUR||||||||VISIT9999",
].join("\r");

export const ORU_R01 = [
  "MSH|^~\\&|RADIS|PRC|GP|CLINIC|20260623081500||ORU^R01|RPT0001|P|2.4",
  "PID|1||8003608166690503^^^AUSHIC^NI||SMITH^JOHN^A||19700101|M",
  "OBR|1||ACC123|CXR^Chest X-Ray^L|||20260623080000",
  "OBX|1|TX|IMPRESSION^Impression^L||No acute cardiopulmonary process.||||||F",
].join("\r");

/** Two messages back to back, mixed line endings, to exercise multi-message splitting. */
export const MULTI_MESSAGE = ADT_A01 + "\n" + ORU_R01;

/** A message using non-standard delimiters (field "#", component "@"). */
export const CUSTOM_DELIMITERS = [
  "MSH#@~\\&#SENDAPP#SENDFAC#RECVAPP#RECVFAC#20260623120000##ADT@A01#MSG9#P#2.4",
  "PID#1##MRN1@@@HOSP@MR##DOE@JANE",
].join("\r");
