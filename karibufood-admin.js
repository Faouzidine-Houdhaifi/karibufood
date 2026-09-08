const ordersKey = 'karibufood-orders';
const SUPABASE_URL = 'https://czbhzxxuqlhpvnjehajj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zJHpg3iMXzVH6TYnkBAQbw_GhCShKcqr';
const formatPrice = price => `${Number(price).toLocaleString('fr-FR')} FC`;
const getOrders = () => JSON.parse(localStorage.getItem(ordersKey) || '[]');

const loadVisitorCount = async () => {
    const visitorTotal = document.getElementById('visitorTotal');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/visitors?select=id`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'count=exact', Range: '0-0' }
        });
        if (!response.ok) throw new Error('Impossible de charger le compteur.');
        const contentRange = response.headers.get('content-range');
        const total = contentRange ? Number(contentRange.split('/')[1]) : 0;
        visitorTotal.textContent = total.toLocaleString('fr-FR');
    } catch (error) {
        console.error(error);
        visitorTotal.textContent = '-';
    }
};

const renderOrders = () => {
    const orders = getOrders();
    const list = document.getElementById('ordersList');
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    document.getElementById('ordersCount').textContent = orders.length;
    document.getElementById('ordersRevenue').textContent = formatPrice(revenue);
    document.getElementById('lastOrder').textContent = orders.length ? new Date(orders[0].createdAt).toLocaleDateString('fr-FR') : '-';
    list.innerHTML = orders.length ? orders.map(order => `<article class="order-card"><div class="order-top"><div><strong>${order.customerName}</strong><small>${order.email} · ${new Date(order.createdAt).toLocaleString('fr-FR')}</small></div><div><span class="order-status">Nouvelle</span><strong class="order-total">${formatPrice(order.total)}</strong></div></div><ul class="order-items">${order.items.map(item => `<li>${item.name} - ${formatPrice(item.price)}</li>`).join('')}</ul><small>Moyen de paiement : ${order.paymentMethod}</small></article>`).join('') : '<div class="empty-orders"><i class="fa-solid fa-inbox"></i><p>Aucune commande enregistrée.</p><small>Les nouvelles commandes apparaîtront ici après validation.</small></div>';
};

document.getElementById('refreshOrders').addEventListener('click', renderOrders);
document.getElementById('refreshOrders').addEventListener('click', loadVisitorCount);
document.getElementById('clearOrders').addEventListener('click', () => { if (confirm('Effacer toutes les commandes enregistrées sur cet appareil ?')) { localStorage.removeItem(ordersKey); renderOrders(); } });
renderOrders();
loadVisitorCount();
