import { useEffect, useMemo, useRef, useState } from 'react';

const buttons = [
  { action: 'clear', label: 'C', className: 'key--ghost' },
  { action: 'backspace', label: '⌫', className: 'key--ghost' },
  { action: 'operator', label: '÷', value: '÷', className: 'key--operator' },
  { action: 'operator', label: '×', value: '×', className: 'key--operator' },
  { action: 'digit', label: '7', value: '7' },
  { action: 'digit', label: '8', value: '8' },
  { action: 'digit', label: '9', value: '9' },
  { action: 'operator', label: '−', value: '-', className: 'key--operator' },
  { action: 'digit', label: '4', value: '4' },
  { action: 'digit', label: '5', value: '5' },
  { action: 'digit', label: '6', value: '6' },
  { action: 'operator', label: '+', value: '+', className: 'key--operator' },
  { action: 'digit', label: '1', value: '1' },
  { action: 'digit', label: '2', value: '2' },
  { action: 'digit', label: '3', value: '3' },
  { action: 'equals', label: '=' },
  { action: 'digit', label: '0', value: '0', className: 'key--wide' },
  { action: 'decimal', label: '.' },
];

const payphoneConfig = {
  token: import.meta.env.VITE_PAYPHONE_TOKEN ?? '',
  storeId: import.meta.env.VITE_PAYPHONE_STORE_ID ?? '',
  amount: Number(import.meta.env.VITE_PAYPHONE_AMOUNT_CENTS ?? '315'),
  currency: import.meta.env.VITE_PAYPHONE_CURRENCY ?? 'USD',
  lat: import.meta.env.VITE_PAYPHONE_LAT ?? '-1.831239',
  lng: import.meta.env.VITE_PAYPHONE_LNG ?? '-78.183406',
  timeZone: Number(import.meta.env.VITE_PAYPHONE_TIMEZONE ?? '-5'),
  reference: import.meta.env.VITE_PAYPHONE_REFERENCE ?? 'Desbloqueo de resultado de calculadora',
  phoneNumber: import.meta.env.VITE_PAYPHONE_PHONE ?? '',
  email: import.meta.env.VITE_PAYPHONE_EMAIL ?? '',
  documentId: import.meta.env.VITE_PAYPHONE_DOCUMENT_ID ?? '',
  identificationType: Number(import.meta.env.VITE_PAYPHONE_IDENTIFICATION_TYPE ?? '1'),
};

function getLastOperatorIndex(expression) {
  return Math.max(
    expression.lastIndexOf('+'),
    expression.lastIndexOf('-'),
    expression.lastIndexOf('×'),
    expression.lastIndexOf('÷')
  );
}

function getCurrentToken(expression) {
  const lastOperatorIndex = getLastOperatorIndex(expression);
  return expression.slice(lastOperatorIndex + 1);
}

function normalizeExpression(expression) {
  return expression.replace(/×/g, '*').replace(/÷/g, '/');
}

function isValidExpression(expression) {
  return /^[0-9+\-×÷. ]+$/.test(expression);
}

function evaluateExpression(expression) {
  const normalized = normalizeExpression(expression).trim();

  if (!normalized || !isValidExpression(expression)) {
    return null;
  }

  if (/[+\-*/.]$/.test(normalized)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${normalized});`)();

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return null;
    }

    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(8)).toString());
  } catch {
    return null;
  }
}

function buildClientTransactionId() {
  return `calc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const sessionKeys = {
  expression: 'calc_pending_expression',
  result: 'calc_pending_result',
  clientTransactionId: 'calc_pending_client_transaction_id',
};

export default function App() {
  const [expression, setExpression] = useState('0');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lockedResult, setLockedResult] = useState('');
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [clientTransactionId, setClientTransactionId] = useState('');
  const paymentBoxRef = useRef(null);
  const paymentBoxInstanceRef = useRef(null);
  const paymentAttemptRef = useRef(false);
  const hasPayphoneCredentials = Boolean(payphoneConfig.token);

  const currentToken = useMemo(() => {
    return getCurrentToken(expression);
  }, [expression]);

  const isModalOpen = paymentState !== 'idle';

  const cancelPayment = () => {
    setPaymentState('idle');
    setPaymentMessage('');
    setConfirmation(null);
    setClientTransactionId('');
    paymentAttemptRef.current = false;
    window.sessionStorage.removeItem(sessionKeys.expression);
    window.sessionStorage.removeItem(sessionKeys.result);
    window.sessionStorage.removeItem(sessionKeys.clientTransactionId);
  };

  const completePaymentFlow = () => {
    const storedResult = window.sessionStorage.getItem(sessionKeys.result) ?? lockedResult;
    setExpression(storedResult || '0');
    setJustEvaluated(true);
    setPaymentState('idle');
    setPaymentMessage('');
    setConfirmation(null);
    setClientTransactionId('');
    paymentAttemptRef.current = false;
    window.sessionStorage.removeItem(sessionKeys.expression);
    window.sessionStorage.removeItem(sessionKeys.result);
    window.sessionStorage.removeItem(sessionKeys.clientTransactionId);
  };

  const reset = () => {
    setExpression('0');
    setJustEvaluated(false);
    setLockedResult('');
    setPaymentState('idle');
    setPaymentMessage('');
    setConfirmation(null);
    setClientTransactionId('');
    paymentAttemptRef.current = false;
    window.sessionStorage.removeItem(sessionKeys.expression);
    window.sessionStorage.removeItem(sessionKeys.result);
    window.sessionStorage.removeItem(sessionKeys.clientTransactionId);
  };

  const appendDigit = (digit) => {
    setExpression((current) => {
      if (justEvaluated || current === '0') {
        return digit;
      }

      return current + digit;
    });
    setJustEvaluated(false);
  };

  const appendDecimal = () => {
    if (justEvaluated) {
      setExpression('0.');
      setJustEvaluated(false);
      return;
    }

    if (!currentToken.includes('.')) {
      setExpression((current) => (currentToken.length === 0 ? current + '0.' : current + '.'));
    }
  };

  const appendOperator = (operator) => {
    setExpression((current) => {
      const lastCharacter = current.slice(-1);
      const isOperator = /[+\-×÷]/.test(lastCharacter);

      if (current === '0' && operator === '-') {
        return '-';
      }

      if (isOperator) {
        return current.slice(0, -1) + operator;
      }

      return current + operator;
    });

    setJustEvaluated(false);
  };

  const backspace = () => {
    if (isModalOpen) {
      return;
    }

    if (justEvaluated) {
      reset();
      return;
    }

    setExpression((current) => (current.length <= 1 ? '0' : current.slice(0, -1)));
  };

  const openPaymentBox = (resultValue) => {
    if (!hasPayphoneCredentials) {
      setPaymentState('idle');
      setPaymentMessage('');
      return;
    }

    const nextClientTransactionId = buildClientTransactionId();
    setLockedResult(resultValue);
    setClientTransactionId(nextClientTransactionId);
    setPaymentState('needs-payment');
    setPaymentMessage('Paga para desbloquear el resultado.');
    setConfirmation(null);
    window.sessionStorage.setItem(sessionKeys.expression, expression);
    window.sessionStorage.setItem(sessionKeys.result, resultValue);
    window.sessionStorage.setItem(sessionKeys.clientTransactionId, nextClientTransactionId);
  };

  const evaluateSilently = () => {
    const resultValue = evaluateExpression(expression);

    if (resultValue === null) {
      setPaymentState('error');
      setPaymentMessage('La expresión no es válida.');
      return;
    }

    setExpression(expression);
    setJustEvaluated(false);
    openPaymentBox(resultValue);
  };

  const confirmPayment = async ({ id, clientTxId }) => {
    if (!payphoneConfig.token) {
      setPaymentState('error');
      setPaymentMessage('Falta VITE_PAYPHONE_TOKEN para confirmar la transacción.');
      return;
    }

    setPaymentState('processing');
    setPaymentMessage('Confirmando pago con Payphone...');

    try {
      const response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${payphoneConfig.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Number(id),
          clientTxId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo confirmar la transacción.');
      }

      setConfirmation(payload);

      if (payload.statusCode === 3 || payload.transactionStatus === 'Approved') {
        const storedResult = window.sessionStorage.getItem(sessionKeys.result) ?? lockedResult;
        setExpression(storedResult);
        setJustEvaluated(true);
        setPaymentState('approved');
        setPaymentMessage('Pago confirmado. Resultado desbloqueado.');
      } else {
        setPaymentState('declined');
        setPaymentMessage(payload.message || 'El pago no fue aprobado.');
      }

      window.history.replaceState({}, '', window.location.pathname);
    } catch (error) {
      setPaymentState('error');
      setPaymentMessage(error.message || 'Error confirmando el pago.');
    }
  };

  const handleButtonClick = (button) => {
    if (isModalOpen) {
      return;
    }

    switch (button.action) {
      case 'digit':
        appendDigit(button.value);
        break;
      case 'decimal':
        appendDecimal();
        break;
      case 'operator':
        appendOperator(button.value);
        break;
      case 'clear':
        reset();
        break;
      case 'backspace':
        backspace();
        break;
      case 'equals':
        evaluateSilently();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = query.get('id');
    const returnedClientTxId = query.get('clientTransactionId');

    if (id && returnedClientTxId) {
      const storedClientTxId = window.sessionStorage.getItem(sessionKeys.clientTransactionId);
      if (storedClientTxId && storedClientTxId !== returnedClientTxId) {
        setPaymentState('error');
        setPaymentMessage('La transacción devuelta no coincide con la pendiente.');
        return;
      }

      confirmPayment({ id, clientTxId: returnedClientTxId });
    }
  }, []);

  useEffect(() => {
    if (paymentState !== 'needs-payment' || !paymentBoxRef.current || typeof window.PPaymentButtonBox !== 'function') {
      return undefined;
    }

    if (paymentAttemptRef.current && paymentBoxInstanceRef.current) {
      paymentBoxInstanceRef.current.destroy?.();
      paymentBoxInstanceRef.current = null;
    }

    paymentAttemptRef.current = true;

    const buttonBox = new window.PPaymentButtonBox({
      token: payphoneConfig.token,
      clientTransactionId,
      amount: payphoneConfig.amount,
      amountWithoutTax: payphoneConfig.amount,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: payphoneConfig.currency,
      storeId: payphoneConfig.storeId || undefined,
      reference: payphoneConfig.reference,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: payphoneConfig.timeZone,
      lat: payphoneConfig.lat,
      lng: payphoneConfig.lng,
      phoneNumber: payphoneConfig.phoneNumber || undefined,
      email: payphoneConfig.email || undefined,
      documentId: payphoneConfig.documentId || undefined,
      identificationType: payphoneConfig.identificationType,
    });

    buttonBox.onCompletedPayment((payload) => {
      if (payload?.responseUrl) {
        setPaymentMessage('Pago enviado. Esperando confirmación final...');
      }
    });

    buttonBox.render('pp-button');
    paymentBoxInstanceRef.current = buttonBox;

    return () => {
      paymentBoxInstanceRef.current?.destroy?.();
      paymentBoxInstanceRef.current = null;
    };
  }, [clientTransactionId, paymentState]);

  return (
    <main className="calculator-shell" aria-label="Calculadora clásica">
      <div className="calculator-layout">
        <section className="calculator" role="application" aria-label="Calculadora">
          <div className="display" aria-live="polite" aria-atomic="true">
            <div className="display__expression">
              {paymentState === 'approved' ? lockedResult : expression}
            </div>
            <div className="display__hint">LCD</div>
          </div>

          <div className="keys" aria-label="Teclado de la calculadora">
            {buttons.map((button) => (
              <button
                key={`${button.action}-${button.label}`}
                type="button"
                className={`key ${button.className ?? ''}`.trim()}
                onClick={() => handleButtonClick(button)}
                disabled={isModalOpen}
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            {paymentState === 'approved' ? (
              <div className="modal-card__success">
                <div className="modal-card__success-icon">✓</div>
                <h3>¡Pago Confirmado!</h3>
                <p>El resultado ha sido desbloqueado correctamente.</p>
                
                <div className="modal-card__details">
                  <p><strong>Operación:</strong> {window.sessionStorage.getItem(sessionKeys.expression) || expression}</p>
                  <p className="modal-card__result-highlight">
                    <strong>Resultado:</strong> {window.sessionStorage.getItem(sessionKeys.result) || lockedResult}
                  </p>
                </div>

                {confirmation?.transactionStatus && (
                  <div className="modal-card__meta-details">
                    <p>Referencia: {confirmation.reference}</p>
                    <p>Monto: {confirmation.currency} {(confirmation.amount / 100).toFixed(2)}</p>
                  </div>
                )}

                <button type="button" className="modal-card__action-btn" onClick={completePaymentFlow}>
                  Volver a la Calculadora
                </button>
              </div>
            ) : (
              <>
                <h2>Desbloquear Resultado</h2>
                <p>
                  El resultado de la operación se desbloqueará una vez que se confirme el pago con Payphone.
                </p>

                <div className="modal-card__meta">
                  <span>Estado</span>
                  <strong>{paymentState}</strong>
                </div>

                {paymentMessage && <div className="modal-card__message">{paymentMessage}</div>}

                {confirmation?.transactionStatus && (
                  <div className="modal-card__confirmation">
                    <p>Transacción: {confirmation.transactionStatus}</p>
                    <p>Referencia: {confirmation.reference}</p>
                    <p>Monto: {confirmation.currency} {(confirmation.amount / 100).toFixed(2)}</p>
                  </div>
                )}

                <div className="modal-card__box" id="pp-button" ref={paymentBoxRef}>
                  {paymentState === 'needs-payment' && !hasPayphoneCredentials && (
                    <p className="modal-card__placeholder">La Cajita aparecerá cuando carguemos credenciales.</p>
                  )}
                  {paymentState === 'needs-payment' && hasPayphoneCredentials && (
                    <p className="modal-card__placeholder">Cargando pasarela de pago...</p>
                  )}
                </div>

                {paymentState !== 'processing' && (
                  <button type="button" className="modal-card__cancel-btn" onClick={cancelPayment}>
                    Cancelar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
