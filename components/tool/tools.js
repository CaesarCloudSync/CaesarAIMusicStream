export const convertToValidFilename = (string) =>{
    return (string.replace(/[\/|\\:*?"#<>]/g, " "));
}