export const DEFAULT_PROFILE_PHOTO_URL = "/home-icons/profile.svg";

export function isDefaultProfilePhotoURL(photoURL: string | null | undefined) {
  return !photoURL || photoURL === DEFAULT_PROFILE_PHOTO_URL;
}
