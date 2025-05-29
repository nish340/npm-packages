// index.js

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dob)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

module.exports = {
  calculateAge
};
