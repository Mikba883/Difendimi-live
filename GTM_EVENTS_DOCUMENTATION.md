# Google Tag Manager - Eventi dataLayer Implementati

## Struttura Eventi
Tutti gli eventi seguono questa struttura nel dataLayer:
```javascript
window.dataLayer.push({
  event: 'meta_pixel_event',
  event_name: 'NOME_EVENTO',
  event_data: {
    custom_data: {
      // parametri specifici dell'evento
    }
  },
  user_data: {
    // email, phone, ecc. (se disponibile)
  }
});
```

## Eventi Implementati

### 1. PageView
**Trigger**: Ad ogni cambio di pagina/route
**File**: `src/hooks/useMetaPixel.ts`
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'PageView',
  event_data: {
    event_source_url: window.location.href
  }
}
```

### 2. CompleteRegistration
**Trigger**: Quando l'utente completa la registrazione (email o Google)
**File**: `src/pages/Login.tsx`
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'CompleteRegistration',
  event_data: {
    custom_data: {
      method: 'email' | 'google',
      user_id: 'USER_ID',
      email: 'USER_EMAIL'
    }
  },
  user_data: {
    email: 'USER_EMAIL'
  }
}
```

### 3. StartFreeTrial
**Trigger**: Quando l'utente invia il primo messaggio in chat
**File**: `src/pages/NewCase.tsx` (riga ~238)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'StartFreeTrial',
  event_data: {
    custom_data: {
      source: 'new_case_chat',
      trial_type: 'legal_analysis'
    }
  }
}
```

### 4. Lead
**Trigger**: Insieme a StartFreeTrial (primo messaggio chat)
**File**: `src/pages/NewCase.tsx` (riga ~246)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'Lead',
  event_data: {
    custom_data: {
      source: 'new_case_chat'
    }
  }
}
```

### 5. CompleteFreeTrial
**Trigger**: Quando l'utente raggiunge il 100% (tutte le domande risposte)
**File**: `src/pages/NewCase.tsx` (righe ~352 e ~370)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'CompleteFreeTrial',
  event_data: {
    custom_data: {
      questions_answered: 'ALL' | numero,
      case_type: 'CASE_TYPE'
    }
  }
}
```

### 6. GenerateCase
**Trigger**: Quando viene generato un caso con successo
**File**: `src/pages/NewCase.tsx` (riga ~449)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'GenerateCase',
  event_data: {
    custom_data: {
      case_id: 'CASE_ID',
      case_type: 'CASE_TYPE',
      source: 'ai_generation'
    }
  }
}
```

### 7. ViewCase
**Trigger**: Quando l'utente apre il dettaglio di un caso
**File**: `src/pages/CaseDetail.tsx` (riga ~69)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'ViewCase',
  event_data: {
    custom_data: {
      case_id: 'CASE_ID',
      case_status: 'CASE_STATUS',
      case_type: 'CASE_TYPE',
      has_report: true | false
    }
  }
}
```

### 8. ViewContent
**Trigger**: Quando viene visualizzata la pagina Premium
**File**: `src/pages/Premium.tsx` (riga ~21)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'ViewContent',
  event_data: {
    custom_data: {
      content_type: 'product',
      content_name: 'Premium Subscription',
      currency: 'EUR',
      value: 49.60
    }
  }
}
```

### 9. InitiateCheckout
**Trigger**: Quando l'utente clicca su "Accedi ora" per iniziare il checkout Stripe
**File**: `src/pages/Premium.tsx` (riga ~56)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'InitiateCheckout',
  event_data: {
    custom_data: {
      currency: 'EUR',
      value: 49.60
    }
  }
}
```

### 10. Purchase (CompleteCheckout)
**Trigger**: Quando il pagamento Stripe viene completato con successo
**File Client-side**: `src/pages/Dashboard.tsx` (quando `?success=true`)
**File Server-side**: `supabase/functions/stripe-webhook/index.ts` (evento `checkout.session.completed`)
```javascript
{
  event: 'meta_pixel_event',
  event_name: 'Purchase',
  event_data: {
    custom_data: {
      currency: 'EUR',
      value: 49.60,
      content_type: 'product',
      content_name: 'Premium Subscription',
      session_id: 'SESSION_ID' // solo client-side
    }
  },
  user_data: {
    email: 'USER_EMAIL'
  }
}
```

## Note Tecniche
- Il dataLayer viene inizializzato automaticamente se non esiste (in `useMetaPixel.ts`)
- Tutti gli eventi vengono inviati sia al dataLayer (per GTM) che all'API Meta Pixel (server-side)
- I dati utente sensibili (email, phone) vengono hashati lato server prima di essere inviati a Meta
- Gli eventi sono integrati con l'autenticazione Supabase per raccogliere automaticamente i dati utente quando disponibili

## Testing in GTM
Per testare questi eventi in GTM Preview:
1. Attiva la modalità Preview in GTM
2. Naviga nell'applicazione eseguendo le azioni
3. Verifica che gli eventi `meta_pixel_event` appaiano nel debug panel
4. Controlla che `event_name`, `event_data` e `user_data` siano popolati correttamente

## Testing in Meta Events Manager
1. Vai su Meta Events Manager → Test Events
2. Inserisci il test event code se configurato
3. Esegui le azioni nell'app
4. Verifica che gli eventi appaiano nel Test Events panel