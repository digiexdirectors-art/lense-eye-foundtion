exports.calculateGST = (price, qty, gstPercent) => {
    const base = price * qty;
    const gstAmount = (base * gstPercent) / 100;

    return {
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        total: base + gstAmount,
    };
};