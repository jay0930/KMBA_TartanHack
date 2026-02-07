import exifr from 'exifr';

/**
 * Extracts the original capture time from a photo's EXIF data.
 * Returns a time string in "HH:MM" format, or null if no EXIF time found.
 */
export async function extractExifTime(file: File): Promise<string | null> {
  try {
    const exif = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
    });

    if (!exif) return null;

    const dateField: Date | undefined =
      exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;

    if (!dateField || !(dateField instanceof Date)) return null;

    const hours = dateField.getHours().toString().padStart(2, '0');
    const minutes = dateField.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
}
