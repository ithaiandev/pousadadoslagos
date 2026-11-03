// Tudo fica dentro desta função para não criar variáveis globais
// que outro script possa ler ou alterar.
(function () {
  'use strict';

  // Número do WhatsApp da pousada (55 + DDD + número, sem espaços)
  const WHATSAPP = '5598984224575';

  // Links oficiais. Para trocar pelo link exato, cole aqui o link de
  // "Compartilhar" do Google Maps e o endereço da página da pousada no Booking.
  const LINKS = {
    google: 'https://www.google.com/maps/search/?api=1&query=Pousada%20dos%20Lagos%20Paulino%20Neves%20MA',
    booking: 'https://www.booking.com/hotel/br/pousada-dos-lagos-paulino-neves.pt-br.html',
    bookingAvaliacoes: 'https://www.booking.com/hotel/br/pousada-dos-lagos-paulino-neves.pt-br.html#tab-reviews'
  };

  // Só estes sites podem ser abertos pelos botões (evita link trocado por engano ou malicioso)
  const DOMINIOS_PERMITIDOS = ['wa.me', 'www.google.com', 'maps.app.goo.gl', 'goo.gl', 'g.page', 'www.booking.com', 'booking.com'];

  function linkSeguro(endereco) {
    try {
      const url = new URL(endereco);
      return url.protocol === 'https:' && DOMINIOS_PERMITIDOS.indexOf(url.hostname) !== -1 ? url.href : null;
    } catch (erro) {
      return null;
    }
  }

  // Abre link externo em nova aba sem dar acesso à nossa página
  function prepararLinkExterno(botao, endereco) {
    const seguro = linkSeguro(endereco);
    if (!seguro) {
      botao.removeAttribute('href');
      return;
    }
    botao.href = seguro;
    botao.target = '_blank';
    botao.rel = 'noopener noreferrer';
  }

  function abrirExterno(endereco) {
    const seguro = linkSeguro(endereco);
    if (seguro) window.open(seguro, '_blank', 'noopener,noreferrer');
  }

  function linkWhats(mensagem) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem);
  }

  // Botões com data-link abrem o Google ou o Booking
  document.querySelectorAll('[data-link]').forEach(function (botao) {
    if (Object.prototype.hasOwnProperty.call(LINKS, botao.dataset.link)) {
      prepararLinkExterno(botao, LINKS[botao.dataset.link]);
    }
  });

  // Botões com data-whats abrem o WhatsApp com uma mensagem pronta
  document.querySelectorAll('[data-whats]').forEach(function (botao) {
    const assunto = botao.dataset.whats;
    const mensagem = assunto
      ? 'Olá! Vim pelo site e gostaria de informações sobre ' + assunto + '.'
      : 'Olá! Vim pelo site da Pousada dos Lagos.';
    prepararLinkExterno(botao, linkWhats(mensagem));
  });

  // Aceita só caminhos de arquivos do próprio site (img/ ou videos/)
  function caminhoLocal(caminho) {
    return typeof caminho === 'string' && /^(img|videos)\/[\w\-./]+\.(jpg|png|mp4)$/.test(caminho) && caminho.indexOf('..') === -1
      ? caminho
      : null;
  }

  // No celular o topo fica azul depois que a página rola
  const topo = document.getElementById('topo');
  if (topo) {
    const aoRolar = function () { topo.classList.toggle('solido', window.scrollY > 60); };
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  // ===== Formulário "Receba ofertas" =====
  // Não há servidor: o nome só vai para a mensagem do WhatsApp do próprio visitante.
  // Mesmo assim, limpamos o texto (só letras, espaço, ponto, hífen e apóstrofo, até 40 caracteres).
  const formOfertas = document.getElementById('formOfertas');
  const nomeOferta = document.getElementById('nomeOferta');
  let ultimoEnvio = 0;
  if (formOfertas && nomeOferta) {
    formOfertas.addEventListener('submit', function (e) {
      e.preventDefault();
      const nome = nomeOferta.value.normalize('NFC').replace(/[^A-Za-zÀ-ÿ' .-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (nome.length < 2) {
        nomeOferta.setCustomValidity('Digite o seu nome.');
        nomeOferta.reportValidity();
        nomeOferta.setCustomValidity('');
        return;
      }
      // Evita abrir várias abas com cliques repetidos
      const agora = Date.now();
      if (agora - ultimoEnvio < 3000) return;
      ultimoEnvio = agora;
      abrirExterno(linkWhats('Olá! Meu nome é ' + nome + ' e quero receber as promoções da Pousada dos Lagos.'));
    });
  }

  // ===== Menu do celular =====
  const menu = document.getElementById('menu');
  const menuBotao = document.getElementById('menuBotao');
  if (menu && menuBotao) {
    const fecharMenu = function () {
      menu.classList.remove('aberto');
      menuBotao.classList.remove('aberto');
      menuBotao.setAttribute('aria-expanded', 'false');
    };
    menuBotao.addEventListener('click', function () {
      const aberto = menu.classList.toggle('aberto');
      menuBotao.classList.toggle('aberto', aberto);
      menuBotao.setAttribute('aria-expanded', String(aberto));
    });
    menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', fecharMenu); });
  }

  // ===== Carrossel do Instagram =====
  document.querySelectorAll('[data-carrossel]').forEach(function (carrossel) {
    const trilho = carrossel.querySelector('.carrossel__trilho');
    const esq = carrossel.querySelector('.seta--esq');
    const dir = carrossel.querySelector('.seta--dir');
    const item = trilho && trilho.querySelector('.carrossel__item');
    if (!trilho || !esq || !dir || !item) return;
    const passo = function () { return item.offsetWidth + 15; };
    esq.addEventListener('click', function () { trilho.scrollBy({ left: -passo() }); });
    dir.addEventListener('click', function () {
      const fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 5;
      trilho.scrollTo({ left: fim ? 0 : trilho.scrollLeft + passo() });
    });
  });

  // ===== Foto grande que troca sozinha =====
  document.querySelectorAll('[data-slide]').forEach(function (slide) {
    const fotos = slide.querySelectorAll('img');
    const esq = slide.querySelector('.seta--esq');
    const dir = slide.querySelector('.seta--dir');
    if (fotos.length < 2) return;
    let atual = 0;
    const mostrar = function (n) {
      fotos[atual].classList.remove('ativo');
      atual = (n + fotos.length) % fotos.length;
      fotos[atual].classList.add('ativo');
    };
    let timer = setInterval(function () { mostrar(atual + 1); }, 5000);
    const trocar = function (n) {
      clearInterval(timer);
      mostrar(n);
      timer = setInterval(function () { mostrar(atual + 1); }, 5000);
    };
    if (esq) esq.addEventListener('click', function () { trocar(atual - 1); });
    if (dir) dir.addEventListener('click', function () { trocar(atual + 1); });
  });

  // ===== Clicar na foto abre ela grande =====
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox && lightbox.querySelector('img');
  if (lightbox && lightboxImg) {
    document.querySelectorAll('.carrossel__item img').forEach(function (foto) {
      foto.parentElement.addEventListener('click', function () {
        const grande = caminhoLocal(foto.dataset.full) || caminhoLocal(foto.getAttribute('src'));
        if (!grande) return;
        lightboxImg.src = grande;
        lightboxImg.alt = foto.alt;
        lightbox.hidden = false;
      });
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target !== lightboxImg) lightbox.hidden = true;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') lightbox.hidden = true;
    });
  }

  // ===== Animações de entrada (iguais às do modelo) =====
  // Cada elemento com data-anim anima uma vez, quando aparece na tela.
  const animados = document.querySelectorAll('[data-anim]');
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || semMovimento) {
    animados.forEach(function (el) { el.classList.add('animado'); });
  } else {
    const observador = new IntersectionObserver(function (itens) {
      itens.forEach(function (item) {
        if (item.isIntersecting) {
          item.target.classList.add('animado');
          observador.unobserve(item.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    animados.forEach(function (el) { observador.observe(el); });
  }

  // ===== Celular: topo some ao descer e volta ao subir =====
  if (topo) {
    let ultimaPosicao = window.scrollY;
    window.addEventListener('scroll', function () {
      const y = window.scrollY;
      const menuAberto = menu && menu.classList.contains('aberto');
      topo.classList.toggle('escondido', y > ultimaPosicao && y > 200 && !menuAberto);
      ultimaPosicao = y;
    }, { passive: true });
  }

  // ===== Carrossel do Instagram anda sozinho a cada 5 segundos (como no modelo) =====
  document.querySelectorAll('[data-carrossel]').forEach(function (carrossel) {
    const trilho = carrossel.querySelector('.carrossel__trilho');
    const dir = carrossel.querySelector('.seta--dir');
    if (!trilho || !dir || semMovimento) return;
    let pausado = false;
    let visivel = false;
    ['mouseenter', 'touchstart', 'focusin'].forEach(function (ev) {
      carrossel.addEventListener(ev, function () { pausado = true; }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      carrossel.addEventListener(ev, function () { pausado = false; });
    });
    let voltar;
    carrossel.addEventListener('touchend', function () {
      clearTimeout(voltar);
      voltar = setTimeout(function () { pausado = false; }, 6000);
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (itens) { visivel = itens[0].isIntersecting; }).observe(carrossel);
    }
    setInterval(function () {
      if (!pausado && visivel && !document.hidden) dir.click();
    }, 5000);
  });

  // Ano no rodapé
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
