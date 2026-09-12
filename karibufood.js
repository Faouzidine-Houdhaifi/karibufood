// ============================================================
// KARIBUFOOD - SYSTÈME DE COMMANDES
// Supabase + Panier + Paiement
// ============================================================

// ------------------------------------------------------------
// 1. CONFIGURATION SUPABASE
// ------------------------------------------------------------

const SUPABASE_URL = 'https://czbhzxxuqlhpvnjehajj.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_zJHpg3iMXzVH6TYnkBAQbw_GCShKcqr';

let supabaseClient = null;

const repairEncoding = value => {
    return value
        .replace(/Ã©/g, '\u00e9')
        .replace(/Ã¨/g, '\u00e8')
        .replace(/Ãª/g, '\u00ea')
        .replace(/Ã /g, '\u00e0')
        .replace(/Ã /g, '\u00e0')
        .replace(/Ã¢/g, '\u00e2')
        .replace(/Ã§/g, '\u00e7')
        .replace(/Ã®/g, '\u00ee')
        .replace(/Ã¯/g, '\u00ef')
        .replace(/Ã´/g, '\u00f4')
        .replace(/Ã»/g, '\u00fb')
        .replace(/Ã¹/g, '\u00f9')
        .replace(/Ã¼/g, '\u00fc')
        .replace(/Ã‰/g, '\u00c9')
        .replace(/Ã€/g, '\u00c0')
        .replace(/Â©/g, '\u00a9')
        .replace(/â˜…/g, '\u2605');
};

const repairPageEncoding = () => {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
    );

    let node;
    while (node = walker.nextNode()) {
        node.nodeValue = repairEncoding(node.nodeValue);
    }

    document
        .querySelectorAll('[data-name], [data-accompagnements], [alt], [aria-label]')
        .forEach(element => {
            ['data-name', 'data-accompagnements', 'alt', 'aria-label']
                .forEach(attribute => {
                    if (element.hasAttribute(attribute)) {
                        element.setAttribute(
                            attribute,
                            repairEncoding(element.getAttribute(attribute))
                        );
                    }
                });
        });
};

repairPageEncoding();


// ------------------------------------------------------------
// 2. CHARGEMENT DE SUPABASE
// ------------------------------------------------------------

const loadSupabase = () => {
    return new Promise((resolve, reject) => {

        // Si Supabase est déjà chargé
        if (window.supabase) {
            resolve(window.supabase);
            return;
        }

        const script = document.createElement('script');

        script.src =
            'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

        script.onload = () => {
            if (!window.supabase) {
                reject(
                    new Error('Impossible de charger Supabase.')
                );
                return;
            }

            resolve(window.supabase);
        };

        script.onerror = () => {
            reject(
                new Error('Impossible de charger la bibliothèque Supabase.')
            );
        };

        document.head.appendChild(script);
    });
};


// ------------------------------------------------------------
// 3. INITIALISATION
// ------------------------------------------------------------

const initSupabase = async () => {
    try {

        const supabase = await loadSupabase();

        supabaseClient = supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log('✅ Supabase connecté avec succès');
        trackVisitor();

    } catch (error) {

        console.error(
            '❌ Erreur de connexion à Supabase :',
            error
        );

        alert(
            'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
        );
    }
};


// ------------------------------------------------------------
// 4. INITIALISER SUPABASE
// ------------------------------------------------------------

initSupabase();


// ------------------------------------------------------------
// 5. ÉLÉMENTS DU SITE
// ------------------------------------------------------------

const cart = [];

const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');

const paymentModal =
    document.getElementById('paymentModal');

const paymentForm =
    document.getElementById('paymentForm');

const paymentTotal =
    document.getElementById('paymentTotal');


// ------------------------------------------------------------
// 6. FORMATAGE DU PRIX
// ------------------------------------------------------------

const formatPrice = price => {
    return `${price.toLocaleString('fr-FR')} FC`;
};


// ------------------------------------------------------------
// 7. AFFICHER LE PANIER
// ------------------------------------------------------------

const renderCart = () => {

    const items =
        document.getElementById('cartItems');

    const total =
        cart.reduce(
            (sum, item) => sum + item.price,
            0
        );

    document.getElementById('cartCount').textContent =
        cart.length;

    document.getElementById('cartTotal').textContent =
        formatPrice(total);

    items.innerHTML = cart.length
        ? cart.map((item, index) => `
            <div class="cart-item">

                <div>
                    <strong>${item.name}</strong>

                    <small>
                        ${formatPrice(item.price)}
                    </small>
                </div>

                <button
                    type="button"
                    data-remove="${index}"
                    aria-label="Supprimer ${item.name}"
                >
                    <i class="fa-solid fa-trash-can"></i>
                </button>

            </div>
        `).join('')

        : `
            <div class="empty-cart">

                <i class="fa-solid fa-basket-shopping"></i>

                <p>
                    Votre panier est vide.
                </p>

                <small>
                    Ajoutez un plat pour commencer.
                </small>

            </div>
        `;
};


// ------------------------------------------------------------
// 8. OUVRIR / FERMER LE PANIER
// ------------------------------------------------------------

const setCartOpen = open => {

    drawer.classList.toggle('open', open);

    overlay.classList.toggle(
        'visible',
        open
    );

    drawer.setAttribute(
        'aria-hidden',
        !open
    );
};


// ------------------------------------------------------------
// 9. INITIALISER LE PANIER
// ------------------------------------------------------------

renderCart();


// ------------------------------------------------------------
// 10. OUVRIR LE PAIEMENT
// ------------------------------------------------------------

const openPayment = () => {

    if (!cart.length) {

        setCartOpen(true);

        return;
    }

    paymentTotal.textContent =
        document.getElementById(
            'cartTotal'
        ).textContent;

    setCartOpen(false);

    paymentModal.classList.add('open');

    paymentModal.setAttribute(
        'aria-hidden',
        'false'
    );
};


// ------------------------------------------------------------
// 11. MODALE DES ACCOMPAGNEMENTS
// ------------------------------------------------------------

let dishModal = document.getElementById('dishModal');

if (!dishModal) {
    dishModal = document.createElement('section');
    dishModal.className = 'dish-modal';
    dishModal.id = 'dishModal';
    dishModal.setAttribute('aria-hidden', 'true');
    dishModal.setAttribute('aria-labelledby', 'dishModalTitle');
    dishModal.innerHTML = `<div class="dish-modal-box"><button class="dish-modal-close" id="closeDishModal" type="button" aria-label="Fermer les accompagnements"><i class="fa-solid fa-xmark"></i></button><div class="dish-modal-head"><p class="eyebrow"><span></span> Personnalisez votre plat</p><h2 id="dishModalTitle">Nom du plat</h2></div><fieldset class="dish-modal-list" id="dishModalList"><legend>Choisissez vos accompagnements</legend></fieldset><button class="primary-button dish-modal-add" id="addDishToCart" type="button">Ajouter au panier <i class="fa-solid fa-basket-shopping"></i></button></div>`;
    document.body.appendChild(dishModal);
}

const dishModalTitle = document.getElementById('dishModalTitle');
const dishModalList = document.getElementById('dishModalList');
let addDishToCart = document.getElementById('addDishToCart');
let selectedDishCard = null;

const accompanimentPrices = {
    'Mafé de poulet': { Poulet: 500, Carotte: 0, Oignon: 0 },
    'Brochettes braisées': { 'Riz parfumé': 500, 'Salade verte': 500, Tomate: 0, Oignon: 0 },
    Thieboudienne: { 'Viande de boeufs': 500, 'Poulet braisées': 500, Tomate: 0 },
    Pilawo: {
        'Poulet & antchari': 500,
        'Viande tendre': 500,
        Légumes: 250,
        'Pois chiches': 0,
        'Sauce fait maison': 500,
        Saucisse: 500
    },
    'Poulet coco': { Vermicelle: 500, 'Riz parfumé': 500, Banane: 500, 'Manioc frit': 500 }
};

const getAccompanimentPrice = (dishName, accompaniment) => {
    return accompanimentPrices[dishName]?.[accompaniment] ?? 250;
};

const openDishModal = card => {
    selectedDishCard = card;
    const dishName = card.dataset.name;
    const accompaniments = card.dataset.accompagnements || '';

    if (!addDishToCart) {
        addDishToCart = document.createElement('button');
        addDishToCart.className = 'primary-button dish-modal-add';
        addDishToCart.id = 'addDishToCart';
        addDishToCart.type = 'button';
        addDishToCart.innerHTML = 'Ajouter au panier <i class="fa-solid fa-basket-shopping"></i>';
        dishModalList.insertAdjacentElement('afterend', addDishToCart);
        addDishToCart.addEventListener('click', addSelectedDishToCart);
    }

    dishModalTitle.textContent = dishName;
    dishModalList.innerHTML = accompaniments
        ? `<legend>Choisissez vos accompagnements</legend>${accompaniments.split('|').map(item => { const accompaniment = item.trim(); const price = getAccompanimentPrice(dishName, accompaniment); return `<label class="dish-choice"><input type="checkbox" value="${accompaniment}"><span>${accompaniment}</span><small>${price ? `+${formatPrice(price)}` : 'Gratuit'}</small></label>`; }).join('')}`
        : '<legend>Choisissez vos accompagnements</legend><p class="dish-modal-empty">Aucun accompagnement renseigné.</p>';

    dishModal.classList.add('open');
    dishModal.setAttribute('aria-hidden', 'false');
};

const addSelectedDishToCart = () => {
    if (!selectedDishCard) return;

    const selected = [...dishModalList.querySelectorAll('input:checked')]
        .map(input => input.value);

    const dishName = selectedDishCard.dataset.name;
    const basePrice = Number(selectedDishCard.dataset.price);
    const price = basePrice + selected.reduce(
        (total, accompaniment) => total + getAccompanimentPrice(dishName, accompaniment),
        0
    );
    const accompaniments = selected.length
        ? ` avec ${selected.join(', ')}`
        : ' sans accompagnement';

    cart.push({
        name: `${dishName}${accompaniments}`,
        price: price
    });

    renderCart();
    closeDishModal();
    setCartOpen(true);
};

const closeDishModal = () => {
    dishModal.classList.remove('open');
    dishModal.setAttribute('aria-hidden', 'true');
};


// ------------------------------------------------------------
// 12. FERMER LE PAIEMENT
// ------------------------------------------------------------

const closePayment = () => {

    paymentModal.classList.remove('open');

    paymentModal.setAttribute(
        'aria-hidden',
        'true'
    );
};


// ------------------------------------------------------------
// 13. AJOUTER UN PRODUIT AU PANIER
// ------------------------------------------------------------

document
    .querySelectorAll('.quick-add')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const card =
                    button.closest('.food-card');

                if (!card) return;

                const name =
                    card.dataset.name;

                const price =
                    Number(card.dataset.price);

                cart.push({
                    name: name,
                    price: price
                });

                renderCart();

                setCartOpen(true);
            }
        );
    });


document
    .querySelectorAll('.food-image img')
    .forEach(image => {
        image.addEventListener('click', event => {
            const card = image.closest('.food-card');
            if (!card || !card.dataset.accompagnements) return;

            event.preventDefault();
            openDishModal(card);
        });
    });


const closeDishModalButton = document.getElementById('closeDishModal');

if (closeDishModalButton) {
    closeDishModalButton.addEventListener('click', closeDishModal);
}


if (addDishToCart) addDishToCart.addEventListener('click', addSelectedDishToCart);


dishModal.addEventListener('click', event => {
    if (event.target === dishModal) {
        closeDishModal();
    }
});


// ------------------------------------------------------------
// 14. SUPPRIMER UN PRODUIT
// ------------------------------------------------------------

document
    .getElementById('cartItems')
    .addEventListener(
        'click',
        event => {

            const remove =
                event.target.closest(
                    '[data-remove]'
                );

            if (!remove) return;

            const index =
                Number(remove.dataset.remove);

            cart.splice(index, 1);

            renderCart();
        }
    );


// ------------------------------------------------------------
// 14. BOUTON PANIER
// ------------------------------------------------------------

document
    .getElementById('cartButton')
    .addEventListener(
        'click',
        () => setCartOpen(true)
    );


// ------------------------------------------------------------
// 15. FERMER LE PANIER
// ------------------------------------------------------------

document
    .getElementById('closeCart')
    .addEventListener(
        'click',
        () => setCartOpen(false)
    );


// ------------------------------------------------------------
// 16. OVERLAY
// ------------------------------------------------------------

overlay.addEventListener(
    'click',
    () => setCartOpen(false)
);


// ------------------------------------------------------------
// 17. BOUTON PASSER LA COMMANDE
// ------------------------------------------------------------

document
    .getElementById('checkoutButton')
    .addEventListener(
        'click',
        openPayment
    );


// ------------------------------------------------------------
// 18. FERMER LA FENÊTRE DE PAIEMENT
// ------------------------------------------------------------

document
    .getElementById('closePayment')
    .addEventListener(
        'click',
        closePayment
    );


// ------------------------------------------------------------
// 19. CHOIX DE LA MÉTHODE DE PAIEMENT
// ------------------------------------------------------------

const mobilePaymentMethod =
    document.querySelector(
        '.payment-method[data-method="mobile"]'
    );

if (mobilePaymentMethod) {

    mobilePaymentMethod.dataset.method = 'mvola';

    const methodLabel =
        mobilePaymentMethod.querySelector('span');

    if (methodLabel) {
        methodLabel.innerHTML =
            'Mvola<small>Paiement mobile</small>';
    }
}

const mobileFields =
    document.getElementById('mobileFields');

if (mobileFields && !mobileFields.querySelector('.mvola-recipient')) {

    const recipient =
        document.createElement('div');

    recipient.className = 'mvola-recipient';
    recipient.innerHTML =
        '<strong>Envoyez le montant à</strong><span>+269 497 18 96</span><small>Après le transfert, indiquez le numéro Mvola utilisé ci-dessous.</small>';

    mobileFields.prepend(recipient);
}

const mobileInput =
    mobileFields?.querySelector('input');

if (mobileInput) {
    mobileInput.name = 'mobile_number';
    mobileInput.parentElement.childNodes[0].textContent =
        'Votre numéro Mvola';
}

document
    .querySelectorAll('.payment-method')
    .forEach(method => {

        method.addEventListener(
            'click',
            () => {

                const active =
                    document.querySelector(
                        '.payment-method.active'
                    );

                if (active) {
                    active.classList.remove('active');
                }

                method.classList.add('active');

                const isCard =
                    method.dataset.method === 'card';

                const isMobile =
                    method.dataset.method === 'mvola';


                // Champs carte
                document.getElementById(
                    'cardFields'
                ).hidden = !isCard;


                // Champs mobile
                document.getElementById(
                    'mobileFields'
                ).hidden = !isMobile;


                // Champs carte obligatoires
                document
                    .querySelectorAll(
                        '.card-fields input'
                    )
                    .forEach(input => {

                        input.required =
                            isCard;
                    });


                // Champ mobile obligatoire
                const mobileInput =
                    document.querySelector(
                        '#mobileFields input'
                    );

                if (mobileInput) {

                    mobileInput.required =
                        isMobile;
                }
            }
        );
    });


// ------------------------------------------------------------
// 20. ENVOYER LA COMMANDE À SUPABASE
// ------------------------------------------------------------

paymentForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        // Vérifier la connexion Supabase
        if (!supabaseClient) {

            alert(
                'La connexion au serveur n’est pas encore prête. Veuillez patienter quelques secondes puis réessayer.'
            );

            return;
        }


        // Vérifier le panier
        if (!cart.length) {

            alert(
                'Votre panier est vide.'
            );

            return;
        }


        // Récupérer les informations du formulaire
        const formData =
            new FormData(paymentForm);


        const customerName =
            String(
                formData.get('name') || ''
            ).trim();


        const email =
            String(
                formData.get('email') || ''
            ).trim();


        // Méthode de paiement sélectionnée
        const selectedMethod =
            document
                .querySelector(
                    '.payment-method.active'
                )
                ?.dataset.method || 'card';


        // Calcul du total
        const total =
            cart.reduce(
                (sum, item) =>
                    sum + item.price,
                0
            );


        // ----------------------------------------------------
        // Préparer la commande
        // ----------------------------------------------------

        const order = {

            customer_name:
                customerName,

            email:
                email,

            items:
                [...cart],

            total:
                total,

            payment_method:
                selectedMethod

            // created_at est créé automatiquement
            // par Supabase
        };


        // ----------------------------------------------------
        // Désactiver le bouton pendant l'envoi
        // ----------------------------------------------------

        const submitButton =
            paymentForm.querySelector(
                'button[type="submit"]'
            );


        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : 'Valider';


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                'Enregistrement...';
        }


        try {

            console.log(
                '📦 Envoi de la commande :',
                order
            );


            // ------------------------------------------------
            // ENVOI À SUPABASE
            // ------------------------------------------------

            const {
                data,
                error
            } = await supabaseClient
                .from('orders')
                .insert([order])
                .select()
                .single();


            // ------------------------------------------------
            // Vérifier l'erreur
            // ------------------------------------------------

            if (error) {

                console.error(
                    '❌ Erreur Supabase :',
                    error
                );

                throw error;
            }


            console.log(
                '✅ Commande enregistrée :',
                data
            );


            // ------------------------------------------------
            // Afficher le succès
            // ------------------------------------------------

            paymentForm.hidden =
                true;

            document
                .getElementById(
                    'paymentSuccess'
                )
                .classList.add(
                    'visible'
                );


            // ------------------------------------------------
            // Vider le panier
            // ------------------------------------------------

            cart.length = 0;

            renderCart();


        } catch (error) {

            console.error(
                '❌ Impossible d’enregistrer la commande :',
                error
            );


            alert(
                '❌ Impossible d’enregistrer votre commande. Vérifiez votre connexion internet et réessayez.'
            );


        } finally {

            // Réactiver le bouton
            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalButtonText;
            }
        }
    }
);


// ------------------------------------------------------------
// 21. TERMINER LE PAIEMENT
// ------------------------------------------------------------

document
    .getElementById('finishPayment')
    .addEventListener(
        'click',
        () => {

            closePayment();

            paymentForm.reset();

            paymentForm.hidden =
                false;

            document
                .getElementById(
                    'paymentSuccess'
                )
                .classList.remove(
                    'visible'
                );
        }
    );


// ------------------------------------------------------------
// 22. FILTRE DES CATÉGORIES
// ------------------------------------------------------------

const foodGrid = document.getElementById('foodGrid');

const renderAccompanimentView = () => {
    let view = document.getElementById('accompanimentView');

    if (!view) {
        view = document.createElement('section');
        view.id = 'accompanimentView';
        view.className = 'accompaniment-view';
        foodGrid.insertAdjacentElement('afterend', view);
    }

    const dishes = [...document.querySelectorAll('.food-card[data-accompagnements]')];

    view.innerHTML = `<div class="accompaniment-heading"><p class="eyebrow"><span></span> Avec votre plat</p><h3>Tous les accompagnements</h3><p>Choisissez les saveurs qui vont avec chaque plat.</p></div><div class="accompaniment-grid">${dishes.map(card => `<article class="accompaniment-card"><h4>${card.dataset.name}</h4><ul>${card.dataset.accompagnements.split('|').map(item => `<li>${item.trim()}</li>`).join('')}</ul></article>`).join('')}</div>`;
    view.hidden = false;
};

const hideAccompanimentView = () => {
    const view = document.getElementById('accompanimentView');
    if (view) view.hidden = true;
};

document
    .querySelectorAll('.category')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const active =
                    document.querySelector(
                        '.category.active'
                    );

                if (active) {

                    active.classList.remove(
                        'active'
                    );
                }

                button.classList.add(
                    'active'
                );

                const isAccompanimentCategory =
                    button.dataset.category === 'accompagnements';

                if (isAccompanimentCategory) {
                    document
                        .querySelectorAll('.food-card')
                        .forEach(card => { card.hidden = true; });
                    renderAccompanimentView();
                    return;
                }

                hideAccompanimentView();

                document
                    .querySelectorAll(
                        '.food-card'
                    )
                    .forEach(card => {

                        card.hidden =
                            button.dataset.category !== 'all'
                            &&
                            card.dataset.category !==
                            button.dataset.category;
                    });
            }
        );
    });


// ------------------------------------------------------------
// 23. COLLECTIONS
// ------------------------------------------------------------

document
    .querySelectorAll('.collection-button')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const categoryButton =
                    document.querySelector(
                        `.category[data-category="${button.dataset.viewCategory}"]`
                    );


                if (categoryButton) {

                    categoryButton.click();
                }


                const foodGrid =
                    document.getElementById(
                        'foodGrid'
                    );


                if (foodGrid) {

                    foodGrid.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        );
    });


// ------------------------------------------------------------
// 24. MENU MOBILE
// ------------------------------------------------------------

document
    .getElementById('menuToggle')
    .addEventListener(
        'click',
        () => {

            document
                .querySelector(
                    '.nav-links'
                )
                .classList.toggle(
                    'open'
                );
        }
    );


// ============================================================
// FIN DU FICHIER
// ============================================================

console.log(
    '🍽️ KaribuFood chargé.'
);

async function trackVisitor() {
    const visitorCount = document.getElementById('visitorCount');
    if (!supabaseClient || sessionStorage.getItem('karibufood-visited')) return;

    sessionStorage.setItem('karibufood-visited', 'true');
    const { error: insertError } = await supabaseClient.from('visitors').insert({});
    if (insertError) {
        console.error('Impossible d’enregistrer la visite :', insertError);
        if (visitorCount) visitorCount.textContent = '-';
        return;
    }

    if (!visitorCount) return;

    const { count, error: countError } = await supabaseClient
        .from('visitors')
        .select('*', { count: 'exact', head: true });

    visitorCount.textContent = countError ? '-' : Number(count).toLocaleString('fr-FR');
}

const openingHours = document.querySelector('.info-option:nth-child(2) p');
if (openingHours) {
    openingHours.innerHTML = 'Samedi - Jeudi : 10h00 - 22h00<br>Vendredi : fermé<br>Dimanche : 10h00 - 15h00';
}