require 'stripe'
require 'sinatra'

# This is your test secret API key.
Stripe.api_key = '{{STRIPE_SECRET_KEY}}'

set :static, true
set :port, 4242

YOUR_DOMAIN = 'http://localhost:4242'

post '/create-checkout-session' do
  content_type 'application/json'

  session = Stripe::Checkout::Session.create({
    line_items: [{
      # Provide the exact Price ID (for example, price_1234) of the product you want to sell
      price: '{{PRICE_ID}}',
      quantity: 1,
    }],
    mode: 'payment',
    success_url: YOUR_DOMAIN + '?success=true',
  })
  redirect session.url, 303
end