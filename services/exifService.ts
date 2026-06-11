
/**
 * Service to inject hardware and location metadata into images.
 * Target: Samsung S24 Ultra (SM-S928U)
 * Location: 105 NC-54 Hwy, Ste 277A, Durham, NC 27713
 */

declare const piexif: any;

export const injectS24UltraMetadata = (base64Image: string): string => {
    try {
        if (typeof piexif === 'undefined') {
            console.error("piexifjs is not loaded");
            return base64Image;
        }

        // Coordinates for 105 NC-54 Hwy, Ste 277A, Durham, NC 27713
        // Latitude: 35.906340 N
        // Longitude: 78.948440 W
        const lat = 35.906340;
        const lng = 78.948440;

        const convertToDMS = (decimal: number) => {
            const absDecimal = Math.abs(decimal);
            const degrees = Math.floor(absDecimal);
            const minutes = Math.floor((absDecimal - degrees) * 60);
            const seconds = Math.round(((absDecimal - degrees) * 60 - minutes) * 60 * 100);
            return [[degrees, 1], [minutes, 1], [seconds, 100]];
        };

        const zeroth: any = {};
        const exif: any = {};
        const gps: any = {};

        // Hardware Identity
        zeroth[piexif.ImageIFD.Make] = "samsung";
        zeroth[piexif.ImageIFD.Model] = "SM-S928U";
        zeroth[piexif.ImageIFD.Software] = "S928USQU1AXB7";
        zeroth[piexif.ImageIFD.DateTime] = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, ':');

        // Photography Parameters (Simulated)
        exif[piexif.ExifIFD.FNumber] = [17, 10]; // f/1.7
        exif[piexif.ExifIFD.ISOSpeedRatings] = 50;
        exif[piexif.ExifIFD.FocalLength] = [63, 10]; // 6.3mm
        exif[piexif.ExifIFD.LensModel] = "S24 Ultra Main Camera";

        // GPS Location (Durham, NC)
        gps[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
        gps[piexif.GPSIFD.GPSLatitude] = convertToDMS(lat);
        gps[piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
        gps[piexif.GPSIFD.GPSLongitude] = convertToDMS(lng);
        gps[piexif.GPSIFD.GPSDateStamp] = zeroth[piexif.ImageIFD.DateTime].split(' ')[0];

        const exifObj = { "0th": zeroth, "Exif": exif, "GPS": gps };
        const exifBytes = piexif.dump(exifObj);
        
        // Remove any existing data and insert our new hardware signature
        const cleanedImage = piexif.remove(base64Image);
        return piexif.insert(exifBytes, cleanedImage);
    } catch (error) {
        console.error("Error injecting EXIF:", error);
        return base64Image;
    }
};
