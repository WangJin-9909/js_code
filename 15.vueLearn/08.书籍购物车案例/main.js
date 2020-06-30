const app = new Vue({
    el: "#app",
    data: {
        books: [
            {
                id: 1,
                name: "《算法导论》",
                beginDate: "2006-9",
                price: 85.00,
                count: 1
            },
            {
                id: 2,
                name: "《UNIX编程艺术》",
                beginDate: "2006-2",
                price: 59.00,
                count: 1
            },
            {
                id: 3,
                name: "《编程大全》",
                beginDate: "2008-10",
                price: 39.00,
                count: 1
            },
            {
                id: 4,
                name: "《代码大全》",
                beginDate: "2006-3",
                price: 128.00,
                count: 1
            },
        ]
    },
    methods: {
        getFinalPrice(price) {
            /*商品价格保存2位小数*/
            return "￥" + price.toFixed(2);
        },

        minus(index) {
            if (this.books[index].count == 0) {
                return;
            }
            this.books[index].count--;
        },
        add(index) {
            this.books[index].count++;
        },
        removeHandl(index) {
            /*从数组中移除内容*/
            this.books.splice(index, 1)
        }
    },
    computed:{
        TotalPrice() {
            let pr = 0;
            for (let i = 0; i < this.books.length; i++) {
                pr += this.books[i].price * this.books[i].count;
            }
            return pr;
        },
    },
    filters: {
        /*过滤器的声明和函数方法很像啊*/
        showPrice(price) {
            return "￥" + price.toFixed(2);
        }
    }

});