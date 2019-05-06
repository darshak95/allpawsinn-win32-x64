'use babel';
import React, { Component } from 'react';

const sql = require('mssql')
const sqlConfig = require('../../js/sqlconfig')
const booking_lib = require('../../js/bookinglib')

export default class Admin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // adminSetting: this.props.adminSetting,
            adminSetting: {
                DayCareRate: "",
                BookingRate: "",
                Tax: "",
                Discount: ""
            },
            adminSettingList: this.props.adminSettingTable,
            buttonValue: true
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleRowSlection = this.handleRowSlection.bind(this);
        this.handleDeleteService = this.handleDeleteService.bind(this);
    }

    

    async handleQuery(adminSetting) {
        let pool = await sql.connect(sqlConfig);
        let dayCareRate = parseFloat(adminSetting.DayCareRate);
        let bookingRate = parseFloat(adminSetting.BookingRate);
        let tax = parseFloat(adminSetting.Tax)
        let discount = parseFloat(adminSetting.Discount)

        let queryString = ` UPDATE dbo.AdminSetting SET
		dbo.AdminSetting.IsActive = 0

        Insert into AdminSetting 
        (DayCareRate, BookingRate, Tax, Discount) Values ('${dayCareRate}','${bookingRate}','${tax}','${discount}')`

        let result = await pool.request()
            .query(queryString)

         let queryString2 = `SELECT * FROM dbo.AdminSetting`;

        let result2 = await pool.request()
            .query(queryString2)    

        sql.close()


        this.setState({
            adminSettingList: result2.recordset
        })
    }

    async getAdminSettings() {
        await sql.close()
        let pool = await sql.connect(sqlConfig)
        let result = await pool.request().query("SELECT TOP 10 * from dbo.AdminSetting")
        await sql.close()
         //console.log(result.recordsets)
        this.setState({
            adminSettingList: result.recordsets
        })
    }

    handleSubmit(event) {
        event.preventDefault();
        //let adminSetting = {
        //    DayCareRate: event.currentTarget.form[0].value,
        //    BookingRate: event.currentTarget.form[1].value,
        //    Tax: event.currentTarget.form[2].value,
        //    Discount: event.currentTarget.form[3].value
        //}
        //this.props.adminSetting.DayCareRate = event.currentTarget.form[0].value;
        //this.props.adminSetting.BookingRate = event.currentTarget.form[1].value;
        //this.props.adminSetting.Tax = event.currentTarget.form[2].value;
        //this.props.adminSetting.Discount = event.currentTarget.form[3].value;

        this.handleQuery(this.state.adminSetting)
        //this.state.adminSettingList.push(this.state.adminSetting);
        //this.props.updateScreen("admin");

    }

    handleChange(event) {

        let dummy = this.state.adminSetting;
        dummy[event.target.name] = event.target.value;
        this.setState({
            adminSetting: dummy
        })
    }
    handleRowSlection(event,dayCareRate,bookingRate,tax,discount) {
        this.updateRowSelection(dayCareRate,bookingRate,tax,discount);
    }

    async updateRowSelection(dayCareRate,bookingRate,tax,discount) {
        let pool = await sql.connect(sqlConfig)

        let qr = `UPDATE dbo.AdminSetting SET
		dbo.AdminSetting.IsActive = 0
        
        UPDATE dbo.AdminSetting SET 
		dbo.AdminSetting.IsActive = 1 
		WHERE dbo.AdminSetting.DayCareRate = '${dayCareRate}' AND dbo.AdminSetting.BookingRate='${bookingRate}' AND dbo.AdminSetting.Tax='${tax}' AND dbo.AdminSetting.Discount='${discount}'`;

        let result = await pool.request()
            .query(qr);



        let qr2 = `SELECT * FROM dbo.AdminSetting`
         
        let result2 = await pool.request()
            .query(qr2); 

        sql.close()

        this.setState({
                adminSettingList : result2.recordset
            }) 
    }

    handleDeleteService(event, dayCareRate,bookingRate,tax,discount) {
        this.deleteServiceQuery(dayCareRate,bookingRate,tax,discount);
        /*this.state.adminSettingList.pop(this.state.adminSetting);
        this.props.updateScreen("admin");*/
    }

     async deleteServiceQuery(dayCareRate,bookingRate,tax,discount) {
        let pool = await sql.connect(sqlConfig)

        let qr = `DELETE from dbo.AdminSetting
        WHERE dbo.AdminSetting.DayCareRate = '${dayCareRate}' AND dbo.AdminSetting.BookingRate='${bookingRate}' AND dbo.AdminSetting.Tax='${tax}' AND dbo.AdminSetting.Discount='${discount}'

        UPDATE dbo.AdminSetting SET 
        dbo.AdminSetting.IsActive = 1 
        WHERE dbo.AdminSetting.ID IN(SELECT TOP 1 dbo.AdminSetting.ID from dbo.AdminSetting)`

        let result = await pool.request()
            .query(qr);

        let qr2 = `SELECT * FROM dbo.AdminSetting`
        
        let result2 = await pool.request()
            .query(qr2);    
        sql.close();

        this.setState({
                adminSettingList : result2.recordset
        }) 
    }

    render() {
        return (
            <div>
                <div className="box cal" id="admin">
        
                    <h3>Admin</h3><br></br>
                    <div>
                        <form>
                            <div className="box">
                                <div className="row">
                                    <div className="col-sm-6"><b>Day Care Rate: </b><br></br></div>
                                    <div className="col-sm-6"><input name="DayCareRate" type="number" value={this.state.adminSetting.DayCareRate} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Booking Rate: </b><br></br></div>
                                    <div className="col-sm-6"><input name="BookingRate" type="number" value={this.state.adminSetting.BookingRate} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Tax: </b><br></br></div>
                                    <div className="col-sm-6"><input name="Tax" type="number" value={this.state.adminSetting.Tax} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Discount: </b><br></br></div>
                                    <div className="col-sm-6"><input name="Discount" type="number" value={this.state.adminSetting.Discount} onChange={this.handleChange} /><br></br></div>
                                </div>
                            </div>
                            <br></br>
                            <button className="profileButton" onClick={this.handleSubmit}> Add </button>
                            <br></br>
                        </form>
                    </div>
                    <div id="adminList">
                        <table id="tblAdminList" className="table table-hover tableAdmin">
                            <thead>
                                <tr>
                                
                                    <th>
                                        Day Care Rate($)
                        </th>
                                    <th>
                                        Booking Rate($)
                        </th>
                                    <th>
                                        Tax(%)
                        </th>
                                    <th>
                                        Discount($)
                        </th>
                                    <th>
                                        Active
                                            </th>
                                    <th>
                                        Delete
                                    </th>    

                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.adminSettingList &&
                                    this.state.adminSettingList.map((el, index) => {
                                        return (
                                            <tr key={index}>
                                                <td>{el.DayCareRate}</td>
                                                <td>{el.BookingRate}</td>
                                                <td>{el.Tax}</td>
                                                <td>{el.Discount}</td>
                                                <td>
                                                    {(el.IsActive == 1) ?
                                                        <input type="radio" value = {true} name="rdbAdminSetting" onChange={(e) => this.handleRowSlection(e, el.DayCareRate,el.BookingRate,el.Tax,el.Discount)} checked={this.state.buttonValue===true} />
                                                        : <input type="radio" value = {false} name="rdbAdminSetting" onChange={(e) => this.handleRowSlection(e, el.DayCareRate,el.BookingRate,el.Tax,el.Discount)} checked={this.state.buttonValue===false} />
                                                    }
                                                </td>
                                                <td>
                                                    <a title="delete" onClick={(e) => this.handleDeleteService(e,el.DayCareRate,el.BookingRate,el.Tax,el.Discount)}><span className="glyphicon glyphicon-trash" aria-hidden="true" style={{cursor:'pointer'}}></span></a>
                                                    
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )
    }
}