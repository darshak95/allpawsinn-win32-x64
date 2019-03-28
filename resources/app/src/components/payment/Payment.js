'use babel';

import React from 'react';
import Multiselect from 'react-bootstrap-multiselect';

let bookingChargesToPay = 0
//let taxToPay = 0
//let totalToPay = 0
let subToPay = 0
let extraServiceCharges = 0
let otherCharges = 0
let payStatus = 0;

async function handleQuery(booking, taxToPay, totalToPay, extraServices) {
    const sqlConfig = require('../../js/sqlconfig')
    const sql = require('mssql')

    let pool = await sql.connect(sqlConfig)
    let id = booking.KennelID
    let qr2 = "Update dbo.KennelOccupancy SET Occupancy = 0 WHERE ID = " + id
    await pool.request()
        .query(qr2)

    let stat = booking.Status
    let bookingId = parseInt(booking.BookingID)
    let queryString = `UPDATE BookingObjects SET Status = '${booking.Status}' WHERE dbo.BookingObjects.BookingID = ${bookingId}`
    queryString += ` INSERT INTO Payments (BookingID,OtherChargesPaid,TaxPaid,TotalChargesPaid,ExtraServices) Values ('${bookingId}' ,${otherCharges} ,${taxToPay} ,${totalToPay} , '${extraServices}')`;
    let result = await pool.request()
        .query(queryString)
    sql.close()
}

export default class Payment extends React.Component {
    constructor(props) {
        super(props)
        //let services = this.props.extraServices;
        //let service_list = [];
        //for (let i = 0; i < services.length; i++) {
        //    // if (services[i].Status == true)
        //    service_list.push(
        //        { label: services[i].ServiceName + ' ($' + services[i].Cost + ')', value: services[i].Cost }
        //    )
        //}

        this.state = {
            booking: this.props.booking,
            dropdown: [],
            selectedExtras: [],
            extraServices: this.props.extraServices,
            taxToPay: 0,
            totalToPay: 0,
            paymentFields: {}
        }
        this.getSubTotal = this.getSubTotal.bind(this)
        this.getTotal = this.getTotal.bind(this)
        this.getTax = this.getTax.bind(this)
        this.getTotalToPay = this.getTotalToPay.bind(this)
        this.handlePrintSubmit = this.handlePrintSubmit.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.extraServiceNames = this.extraServiceNames.bind(this)
        this.handleDeleteService = this.handleDeleteService.bind(this)
        this.dropdownSelected = this.dropdownSelected.bind(this)
        this.getPaymentStatus(this.props.booking.BookingID);
    }
    componentDidMount() {
        this.extraServiceNames();
        let booking = this.state.booking;
        this.setState({
            taxToPay: parseFloat(this.getTax(booking).toFixed(2)),
            totalToPay: parseFloat(this.getTotalToPay(booking).toFixed(2))
        });
    }


   async getPaymentStatus(bookingId) {
        const sqlConfig = require('../../js/sqlconfig');
        const sql = require('mssql');
        sql.close()
        let pool = await sql.connect(sqlConfig);
        let result = await pool.request()
            .query("SELECT top 1 * from dbo.Payments Where BookingID = " + bookingId);
        sql.close();
        console.log(result.recordset[0].BookingID);
        payStatus = result.recordset[0].BookingID;
        let selectedExtraIDs = result.recordset[0].ExtraServices.split(",");
        let dummySelectedExtras = [];
        selectedExtraIDs.forEach(obj => {
            this.props.extraServices.forEach(obj2 => {
                if (obj2.ID == obj) {
                    dummySelectedExtras.push(obj2);
                }
            });
        });
        this.setState({
            selectedExtras: dummySelectedExtras,
            paymentFields: result.recordset[0]
        });

    }


    async getPaymentByBookingId(bookingId) {
        
        const sql = require('mssql');
        sql.close();
        const sqlConfig = require('../../js/sqlconfig');
        let pool = await sql.connect(sqlConfig);
        let result = await pool.request()
            .query("SELECT BookingID from dbo.Payments Where BookingID = " + bookingId);
        sql.close();
        let selectedExtraIDs = result.recordset[0].ExtraServices.split(",");
        let dummySelectedExtras = [];
        selectedExtraIDs.forEach(obj => {
            this.props.extraServices.forEach(obj2 => {
                if (obj2.ID == obj) {
                    dummySelectedExtras.push(obj2);
                }
            });
        });
        this.setState({
            selectedExtras: dummySelectedExtras,
            paymentFields: result.recordset[0]
        });
    }

    getSubTotal(booking) {
        let rate = 0
        if (booking.DayCare) {
            rate = booking.DayCareRate
        }
        else {
            rate = booking.BoardingRate
        }
        let total = booking.NoDays * rate

        return total
    }

    getTotal(booking) {
        let total = this.getSubTotal(booking)
        let discoRate = 0

        if (Array.isArray(booking.Discount)) {
            discoRate = booking.Discount[0]
        }
        else {
            discoRate = booking.Discount
        }

        let disco = (total * discoRate) / 100

        total -= disco

        return total
    }

    getTax(booking) {
        let total = this.getTotal(booking)

        let taxRate = this.props.adminSetting.Tax

        let tax = ((total * taxRate) / 100)

        return tax
    }

    getTotalToPay(booking) {
        let total = this.getTotal(booking)
        let tax = this.getTax(booking)
        let pay = total + tax

        return pay;
    }

    handleSubmit(event) {
        this.props.kennel_map[this.props.booking.KennelID] = 0
       // this.props.booking.Status = 'CO'
        let extraServices = [];
        this.state.selectedExtras.forEach(obj => {
            extraServices.push(obj.ID);
        });

        handleQuery(this.props.booking, this.state.taxToPay, this.state.totalToPay, extraServices.join())
        //query kennel map
        event.preventDefault();
        this.props.updateScreen("calendar"); 
    }

    handlePrintSubmit(event) {
        window.print()
    }

    handleChange(event) {
        //if (event.target.value !== '') {
        otherCharges = (event.currentTarget.form[0].value !== '') ? parseFloat(event.currentTarget.form[0].value) : parseFloat(0);

        let total = bookingChargesToPay + otherCharges + extraServiceCharges

        let taxRate = this.props.adminSetting.Tax;

        let tax = ((total * taxRate) / 100)
        let taxToPay = (tax).toFixed(2);
        let totalToPay = (tax + total).toFixed(2);
        this.setState({
            taxToPay: taxToPay,
            totalToPay: totalToPay
        });

        //$('[name="tax"]').val((tax).toFixed(2));
        //$('[name="total"]').val((tax + total).toFixed(2));

        //this.props.booking = (tax).toFixed(2);
        //this.props.booking.
        //event.currentTarget.form[2].value = (tax).toFixed(2)

        //event.currentTarget.form[3].value = (tax + total).toFixed(2)
        //} else {
        //    let extra = parseFloat(0)
        //    let total = bookingChargesToPay + extra

        //    let taxRate = 8

        //    let tax = ((total * taxRate) / 100)

        //    event.currentTarget.form[2].value = (tax).toFixed(2)

        //    event.currentTarget.form[3].value = (tax + total).toFixed(2)
        //}
    }

    extraServiceNames() {
        let services = this.state.extraServices;
        let service_list = [<option name={0} key={0} value={0}>--</option>];
        for (let i = 0; i < services.length; i++) {
            // if (services[i].Status == true)
            let val = services[i].ID + '-' + services[i].Cost;
            service_list.push(
                <option key={services[i].ID} name={services[i].ID} value={val}>{services[i].ServiceName} (${services[i].Cost})</option>
            )
        }

        //let dropdown = [<option key={0} value={0}>--</option>];
        //for (let i = 1; i < this.state.extraServices.length + 1; i++) {
        //    dropdown.push(<option key={i} value={i}>{this.state.extraServices[i - 1].name}</option>);
        //}

        this.setState({
            dropdown: service_list
        })
    }

    dropdownSelected(event) {
        let dummyExtraServices = this.state.extraServices;
        var keyVal = (event.target.value).split("-");
        var selectedObj = dummyExtraServices.find(obj => {
            return obj.ID === parseInt(keyVal[0]);
        });

        extraServiceCharges += parseFloat(keyVal[1]);

        let total = bookingChargesToPay + otherCharges + extraServiceCharges

        let taxRate = this.props.adminSetting.Tax;

        let tax = ((total * taxRate) / 100);
        let taxToPay = (tax).toFixed(2);
        let totalToPay = (tax + total).toFixed(2);
        //$('input[name="tax"]').val((tax).toFixed(2));
        //$('input[name="total"]').val((tax + total).toFixed(2));
        let dummySelectedExtras = this.state.selectedExtras;
        dummySelectedExtras.push(selectedObj);


        dummyExtraServices.splice(dummyExtraServices.findIndex(
            obj => {
                return obj.ID === parseInt(keyVal[0]);
            }), 1);
        this.setState({
            selectedExtras: dummySelectedExtras,
            extraServices: dummyExtraServices,
            taxToPay: taxToPay,
            totalToPay: totalToPay
            //selectedExtras: [...this.state.selectedExtras, this.state.extraServices[event.target.value - 1]]
        });
        this.extraServiceNames();

    }

    handleDeleteService(event, ID) {
        let dummySelectedExtras = this.state.selectedExtras;
        var selectedObj = dummySelectedExtras.find(obj => {
            return obj.ID === parseInt(ID);
        });

        extraServiceCharges -= parseFloat(selectedObj.Cost);

        let total = bookingChargesToPay + otherCharges + extraServiceCharges

        let taxRate = this.props.adminSetting.Tax;

        let tax = ((total * taxRate) / 100)
        let taxToPay = (tax).toFixed(2);
        let totalToPay = (tax + total).toFixed(2);
        //$('#txtTax').val((tax).toFixed(2));
        //$('#txtTotal').val((tax + total).toFixed(2));
        let dummyExtraServices = this.state.extraServices;
        dummyExtraServices.push(selectedObj);


        dummySelectedExtras.splice(dummySelectedExtras.findIndex(
            obj => {
                return obj.ID === parseInt(ID);
            }), 1);
        this.setState({
            selectedExtras: dummySelectedExtras,
            extraServices: dummyExtraServices,
            taxToPay: taxToPay,
            totalToPay: totalToPay
            //selectedExtras: [...this.state.selectedExtras, this.state.extraServices[event.target.value - 1]]
        });
        this.extraServiceNames();
    }

    //handleSelectChange(option, checked, select) {
    //    if (checked) {
    //        extraServiceCharges += parseFloat($(option).val());
    //    }
    //    else {
    //        extraServiceCharges -= parseFloat($(option).val());
    //    }

    //    let total = bookingChargesToPay + otherCharges + extraServiceCharges

    //    let taxRate = this.props.adminSetting.Tax;

    //    let tax = ((total * taxRate) / 100)
    //    $('[name="tax"]').val((tax).toFixed(2));
    //    $('[name="total"]').val((tax + total).toFixed(2));
    //}
    render() {
        let booking = this.state.booking;
        bookingChargesToPay = parseFloat(this.getTotal(booking).toFixed(2))
        //taxToPay = parseFloat(this.getTax(booking).toFixed(2))
        //totalToPay = parseFloat(this.getTotalToPay(booking).toFixed(2))
        subToPay = parseFloat(this.getSubTotal(booking).toFixed(2));

          if(payStatus) {
            return (
                <div className="box cal" id="paymentInput" style={left}>
                    <form>
                        <h3>Payment</h3>
                        <h4>Booking</h4>
                        <div className="box">
                            <div className="row">
                                <div className="col-sm-6"><b>Animal Name:</b> {this.props.booking.AnimalName != null ? this.props.booking.AnimalName : ''}<br></br></div>
                                <div className="col-sm-6"><b>Client Name:</b> {this.props.booking.FirstName} {this.props.booking.LastName}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Kennel ID:</b> {this.props.booking.KennelID}<br></br></div>
                                <div className="col-sm-6"><b>Animal Breed:</b> {this.props.booking.Breed}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Animal Size:</b> {this.props.booking.Size}<br></br></div>
                                <div className="col-sm-6"><b>Days:</b> {this.props.booking.NoDays}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Date In:</b> {this.props.booking.DateIn.toString()}<br></br></div>
                                <div className="col-sm-6"><b>Date Out:</b> {this.props.booking.DateOut.toString()}<br></br></div>
                            </div>
                        </div>
                        <br></br>
                        <div className="box">
                            <div className="row">
                                <div className="col-sm-6"><b>Boarding Rate: $ </b>{this.props.booking.BoardingRate != null ? this.props.booking.BoardingRate : ''}<br></br></div>
                                <div className="col-sm-6"><b>DayCare Rate: $ </b>{this.props.booking.DayCareRate}<br></br></div>
                            </div>

                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Sub Total: $ </b>{subToPay}<br></br></div>
                                <div className="col-sm-6"><b>Discount: % </b>{!Array.isArray(this.props.booking.Discount) ? this.props.booking.Discount : this.props.booking.Discount[0]}<br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Net Booking Charges   $</b>{bookingChargesToPay}<br></br></div>
                                <div className="col-sm-6"><b>Other Goods: $ </b>{this.state.paymentFields.OtherChargesPaid}<br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>NY State Tax   $</b>{this.state.paymentFields.TaxPaid}<br></br></div>
                                <div className="col-sm-6"><b>Total To Pay   $</b>{this.state.paymentFields.TotalChargesPaid}<br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Extras   </b>
                                </div>
                                <div className="col-sm-6">
                                    {
                                        this.state.selectedExtras.map((el) => {
                                            return <p key={el.ServiceName}>{el.ServiceName} - ${el.Cost} </p>
                                        })
                                    }
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Payment Date </b>{(new Date(Date.parse(this.state.paymentFields.PaymentDate))).toLocaleDateString()} {(new Date(Date.parse(this.state.paymentFields.PaymentDate))).toLocaleTimeString()}<br></br></div>
                            </div>


                        </div>
                        <br></br>
                        <span className="print"><button className="profileButton" onClick={this.handlePrintSubmit}> Print </button></span>
                    </form>

                </div>

            )
        }
        else {
            return (
                <div className="box cal" id="paymentInput" style={left}>
                    <form>
                        <h3>Payment</h3>
                        <h4>Booking</h4>
                        <div className="box">
                            <div className="row">
                                <div className="col-sm-6"><b>Animal Name:</b> {this.props.booking.AnimalName != null ? this.props.booking.AnimalName : ''}<br></br></div>
                                <div className="col-sm-6"><b>Client Name:</b> {this.props.booking.FirstName} {this.props.booking.LastName}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Kennel ID:</b> {this.props.booking.KennelID}<br></br></div>
                                <div className="col-sm-6"><b>Animal Breed:</b> {this.props.booking.Breed}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Animal Size:</b> {this.props.booking.Size}<br></br></div>
                                <div className="col-sm-6"><b>Days:</b> {this.props.booking.NoDays}<br></br></div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6"><b>Date In:</b> {this.props.booking.DateIn.toString()}<br></br></div>
                                <div className="col-sm-6"><b>Date Out:</b> {this.props.booking.DateOut.toString()}<br></br></div>
                            </div>
                        </div>
                        <br></br>
                        <div className="box">
                            <div className="row">
                                <div className="col-sm-6"><b>Boarding Rate: $ </b>{this.props.booking.BoardingRate != null ? this.props.booking.BoardingRate : ''}<br></br></div>
                                <div className="col-sm-6"><b>DayCare Rate: $ </b>{this.props.booking.DayCareRate}<br></br></div>
                            </div>

                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Sub Total: $ </b>{subToPay}<br></br></div>
                                <div className="col-sm-6"><b>Discount: % </b>{!Array.isArray(this.props.booking.Discount) ? this.props.booking.Discount : this.props.booking.Discount[0]}<br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Net Booking Charges   $</b>{bookingChargesToPay}<br></br></div>
                                <div className="col-sm-6"><b>Other Goods: $ </b><input name="others" type="number" onChange={this.handleChange} /><br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>NY State Tax   $</b><input disabled id="txtTax" name="tax" type="text" value={this.state.taxToPay} /><br></br></div>
                                <div className="col-sm-6"><b>Total To Pay   $</b><input disabled id="txtTotal" name="total" type="text" value={this.state.totalToPay} /><br></br></div>
                            </div>
                            <hr></hr>
                            <div className="row">
                                <div className="col-sm-6"><b>Extras   </b>
                                    <select onChange={this.dropdownSelected}>
                                        {this.state.dropdown}
                                    </select>
                                </div>

                                <div className="col-sm-6">
                                    {
                                        this.state.selectedExtras.map((el) => {
                                            return <p key={el.ServiceName}>{el.ServiceName} - ${el.Cost} <a title="delete" onClick={(e) => this.handleDeleteService(e, el.ID)}><span className="glyphicon glyphicon-trash" aria-hidden="true"></span></a></p>
                                        })
                                    }
                                </div>
                            </div>

                        </div>
                        <br></br>
                        <button className="profileButton" onClick={this.handleSubmit}> Take Payment </button>
                        <span className="print"><button className="profileButton" onClick={this.handlePrintSubmit}> Print </button></span>
                    </form>

                </div>
            )
        }
   }
}

const left = {
    display: "inline-block",
    margin: "10px"
}

    //< div className= "row" >
    //    <div className="col-sm-6"><b>Extra Items </b></div>
    //    <div className="col-sm-6">
    //        <Multiselect data={this.state.extraServices} onChange={this.handleSelectChange} multiple />
    //    </div>
    //                    </div >
