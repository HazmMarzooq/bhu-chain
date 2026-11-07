import QRCode from "qrcode";

export async function generateParcelQRCode(
  ulpin: string,
  baseUrl: string = "http://localhost:3000"
): Promise<string> {
  const verificationUrl = `${baseUrl}/verify?ulpin=${encodeURIComponent(ulpin)}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 256,
      color: {
        dark: "#0A2540",
        light: "#FFFFFF",
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error("QR Code Generation failed:", error);
    return "";
  }
}
