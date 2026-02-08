export const calculatePreciseAge = (birthDate: Date | string): number => {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    // Si no hemos llegado al mes de nacimiento, o es el mes pero no el día...
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
