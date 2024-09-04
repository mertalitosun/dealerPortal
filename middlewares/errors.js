module.exports = async function (req, res) {
  return res.status(400).render("errors/404", {
    title: "Sayfa Bulunamadı",
  });
};
