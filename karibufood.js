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
// 11. FERMER LE PAIEMENT
// ------------------------------------------------------------

const closePayment = () => {

    paymentModal.classList.remove('open');

    paymentModal.setAttribute(
        'aria-hidden',
        'true'
    );
};


// ------------------------------------------------------------
// 12. AJOUTER UN PRODUIT AU PANIER
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


// ------------------------------------------------------------
// 13. SUPPRIMER UN PRODUIT
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
                    method.dataset.method === 'mobile';


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
    openingHours.innerHTML = 'Lundi - Vendredi : 10h00 - 22h00<br>Samedi : 10h00 - 14h00<br>Dimanche : fermé';
}