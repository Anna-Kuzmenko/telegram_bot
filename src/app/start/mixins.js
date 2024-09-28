export default () => {

    Array.prototype.diff = function (a) {
        return this.filter((i) => a.indexOf(i) < 0);
    };

    Number.prototype.toMoneyString = function () {
        const amountString = this.toString().padStart(3, '0');
        const dotPosition = amountString.length - 2;
        return amountString.slice(0, dotPosition) + '.' + amountString.slice(dotPosition);
    };
};
