const cart = [];
const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');
const paymentModal = document.getElementById('paymentModal');
const paymentForm = document.getElementById('paymentForm');
const paymentTotal = document.getElementById('paymentTotal');

const formatPrice = price => `${price.toLocaleString('fr-FR')} FC`;

const renderCart = () => {
    const items = document.getElementById('cartItems');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cartCount').textContent = cart.length;
    document.getElementById('cartTotal').textContent = formatPrice(total);
    items.innerHTML = cart.length ? cart.map((item, index) => `<div class="cart-item"><div><strong>${item.name}</strong><small>${formatPrice(item.price)}</small></div><button type="button" data-remove="${index}" aria-label="Supprimer ${item.name}"><i class="fa-solid fa-trash-can"></i></button></div>`).join('') : '<div class="empty-cart"><i class="fa-solid fa-basket-shopping"></i><p>Votre panier est vide.</p><small>Ajoutez un plat pour commencer.</small></div>';
};

const setCartOpen = open => {
    drawer.classList.toggle('open', open);
    overlay.classList.toggle('visible', open);
    drawer.setAttribute('aria-hidden', !open);
};

const openPayment = () => {
    if (!cart.length) {
        setCartOpen(true);
        return;
    }
    paymentTotal.textContent = document.getElementById('cartTotal').textContent;
    setCartOpen(false);
    paymentModal.classList.add('open');
    paymentModal.setAttribute('aria-hidden', 'false');
};

const closePayment = () => {
    paymentModal.classList.remove('open');
    paymentModal.setAttribute('aria-hidden', 'true');
};

document.querySelectorAll('.quick-add').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.food-card');
    cart.push({ name: card.dataset.name, price: Number(card.dataset.price) });
    renderCart();
    setCartOpen(true);
}));

document.getElementById('cartItems').addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    if (remove) {
        cart.splice(Number(remove.dataset.remove), 1);
        renderCart();
    }
});

document.getElementById('cartButton').addEventListener('click', () => setCartOpen(true));
document.getElementById('closeCart').addEventListener('click', () => setCartOpen(false));
overlay.addEventListener('click', () => setCartOpen(false));
document.getElementById('checkoutButton').addEventListener('click', openPayment);
document.getElementById('closePayment').addEventListener('click', closePayment);

document.querySelectorAll('.payment-method').forEach(method => method.addEventListener('click', () => {
    document.querySelector('.payment-method.active').classList.remove('active');
    method.classList.add('active');
    const isCard = method.dataset.method === 'card';
    document.getElementById('cardFields').hidden = !isCard;
    document.getElementById('mobileFields').hidden = method.dataset.method !== 'mobile';
    document.querySelectorAll('.card-fields input').forEach(input => { input.required = isCard; });
    document.querySelector('#mobileFields input').required = method.dataset.method === 'mobile';
}));

paymentForm.addEventListener('submit', event => {
    event.preventDefault();
    paymentForm.hidden = true;
    document.getElementById('paymentSuccess').classList.add('visible');
    cart.length = 0;
    renderCart();
});

document.getElementById('finishPayment').addEventListener('click', () => {
    closePayment();
    paymentForm.reset();
    paymentForm.hidden = false;
    document.getElementById('paymentSuccess').classList.remove('visible');
});

document.querySelectorAll('.category').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.category.active').classList.remove('active');
    button.classList.add('active');
    document.querySelectorAll('.food-card').forEach(card => {
        card.hidden = button.dataset.category !== 'all' && card.dataset.category !== button.dataset.category;
    });
}));

document.querySelectorAll('.collection-button').forEach(button => button.addEventListener('click', () => {
    const categoryButton = document.querySelector(`.category[data-category="${button.dataset.viewCategory}"]`);
    categoryButton.click();
    document.getElementById('foodGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.getElementById('menuToggle').addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('open'));
