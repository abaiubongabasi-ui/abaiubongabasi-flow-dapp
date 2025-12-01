// IPFS Upload Utilities
// This uses Pinata as the IPFS provider, but you can use any IPFS service

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Upload a file to IPFS via Pinata
 * Requires VITE_PINATA_JWT environment variable
 * @param file - The file to upload
 * @param tokenId - Optional token ID to include in the filename
 * @returns IPFS URI with the file (just the CID, no filename path)
 */
export async function uploadFileToIPFS(
  file: File,
  tokenId?: number
): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;

  // Get file extension
  const fileExtension = file.name.split(".").pop() || "png";
  const fileName = tokenId ? `${tokenId}.${fileExtension}` : file.name;

  if (!pinataJWT) {
    console.warn("VITE_PINATA_JWT not configured, using mock IPFS");
    // Return mock IPFS hash for development
    const mockHash = `QmMock${Date.now()}${Math.random()
      .toString(36)
      .substring(7)}`;
    return `ipfs://${mockHash}`;
  }

  try {
    const formData = new FormData();
    
    // Rename the file before uploading
    const renamedFile = new File([file], fileName, { type: file.type });
    formData.append("file", renamedFile);

    // Add metadata with custom filename
    const metadata = JSON.stringify({
      name: fileName,
    });
    formData.append("pinataMetadata", metadata);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data: PinataResponse = await response.json();
    // Return just the CID - Pinata creates a CID for the file itself
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * Requires VITE_PINATA_JWT environment variable
 * @param metadata - The NFT metadata object
 * @param tokenId - Optional token ID to include in the filename
 * @returns IPFS URI (just the CID, no filename path)
 */
export async function uploadMetadataToIPFS(
  metadata: NFTMetadata,
  tokenId?: number
): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;
  
  const fileName = tokenId ? `${tokenId}.json` : 'metadata.json';

  if (!pinataJWT) {
    console.warn("VITE_PINATA_JWT not configured, using mock IPFS");
    // Return mock IPFS hash for development
    const mockHash = `QmMockMeta${Date.now()}${Math.random()
      .toString(36)
      .substring(7)}`;
    return `ipfs://${mockHash}`;
  }

  try {
    // Convert metadata to JSON string
    const jsonString = JSON.stringify(metadata, null, 2);
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    
    // Upload as a file to maintain filename
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata with custom filename
    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} - Metadata`,
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data: PinataResponse = await response.json();
    // Return just the CID - Pinata creates a CID for the file itself
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return "";

  if (ipfsUri.startsWith("ipfs://")) {
    // Use public IPFS gateway
    return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  if (ipfsUri.startsWith("Qm") || ipfsUri.startsWith("bafy")) {
    return `https://ipfs.io/ipfs/${ipfsUri}`;
  }

  return ipfsUri;
}
