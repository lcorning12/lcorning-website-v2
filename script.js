document.addEventListener('DOMContentLoaded', function () {
  var navCheck = document.getElementById('nav-check');
  document.querySelectorAll('[data-nav-panel] a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (navCheck) navCheck.checked = false;
    });
  });
});
