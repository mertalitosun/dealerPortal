const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");


function getTodayDate(day) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const originalDay = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day ? day : originalDay}`;
}

document.addEventListener("DOMContentLoaded", () => {
  startDate.value = getTodayDate("01");
  endDate.value = getTodayDate();

  endDate.setAttribute("min", startDate.value);
  startDate.addEventListener("change",()=>{
  endDate.setAttribute("min", startDate.value);
  })
});