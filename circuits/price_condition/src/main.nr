// Price Condition Circuit
//
// Proves a price condition is met without revealing the threshold.
// Supports both "price-below" and "price-above" conditions.
//
// Private inputs (hidden):
//   - threshold: The user's secret price threshold
//
// Public inputs (visible in proof):
//   - current_price: Current market price (scaled by 1e8)
//   - intent_hash: Binding to specific intent
//   - is_less_than: 1 for price-below, 0 for price-above

fn main(
    // Private input - never revealed
    threshold: Field,

    // Public inputs - included in proof
    current_price: pub Field,
    intent_hash: pub Field,
    is_less_than: pub Field
) {
    // Constraint: is_less_than must be 0 or 1
    assert(is_less_than * (is_less_than - 1) == 0);

    // If is_less_than == 1: prove current_price < threshold
    // If is_less_than == 0: prove current_price > threshold
    if is_less_than == 1 {
        assert(current_price as u64 < threshold as u64);
    } else {
        assert(current_price as u64 > threshold as u64);
    }

    // Bind proof to intent (prevents proof reuse)
    // In production, verify intent_hash matches expected format
    assert(intent_hash != 0);
}

#[test]
fn test_price_below() {
    // Threshold: 0.12 USD (12000000 in 1e8)
    // Current: 0.10 USD (10000000 in 1e8)
    main(12000000, 10000000, 123456, 1);
}

#[test]
fn test_price_above() {
    // Threshold: 0.08 USD (8000000 in 1e8)
    // Current: 0.10 USD (10000000 in 1e8)
    main(8000000, 10000000, 123456, 0);
}
