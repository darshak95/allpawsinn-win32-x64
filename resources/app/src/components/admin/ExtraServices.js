'use babel';
import React, { Component } from 'react';

const sql = require('mssql')
const sqlConfig = require('../../js/sqlconfig')
const booking_lib = require('../../js/bookinglib')

export default class ExtraServices extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // adminSetting: this.props.adminSetting,
            extraService: {
                ServiceName: "",
                Cost: ""
            },
            extraServiceList: this.props.extraServices
        }
        this.handleAddService = this.handleAddService.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDeleteService = this.handleDeleteService.bind(this);
    }

    async addQuery(extraService) {
        let pool = await sql.connect(sqlConfig);
        let serviceName = extraService.ServiceName;
        let cost = parseFloat(extraService.Cost);

        let queryString1 = `
        Insert into Services
        (ServiceName, IsActive,Cost) Values ('${serviceName}',1,'${cost}')`

        let result1 = await pool.request()
            .query(queryString1)


         let queryString2 = `
        SELECT * from dbo.Services`;

        let result2 = await pool.request()
            .query(queryString2)


        sql.close()    

        this.setState({
            extraServiceList : result2.recordset
        })      


    }

    handleAddService(event) {
        event.preventDefault()
        this.addQuery(this.state.extraService)
        //this.state.extraServiceList.push(this.state.extraService);
        

    }

    handleChange(event) {

        let dummy = this.state.extraService;
        dummy[event.target.name] = event.target.value;
        this.setState({
            extraService: dummy
        })
    }
    handleDeleteService(event, serviceName, cost) {
        this.deleteServiceQuery(serviceName,cost);
        /*this.state.extraServiceList.shift(this.state.extraService);
        this.props.updateScreen("extra_services");*/
    }

    async deleteServiceQuery(serviceName,cost) {
        let pool = await sql.connect(sqlConfig)

        let qr1 = `DELETE FROM dbo.Services 
		WHERE dbo.Services.ServiceName = '${serviceName}' AND dbo.Services.Cost = '${cost}'`;


        let result1 = await pool.request()
            .query(qr1)

        let qr2 = `
        SELECT * from dbo.Services`;

        let result2 = await pool.request()
            .query(qr2)

        this.setState({
            extraServiceList : result2.recordset
        })    


        sql.close()
    }

    async getAdminSettings() {
        await sql.close()
        let pool = await sql.connect(sqlConfig)
        let result = await pool.request().query("SELECT TOP 10 * from dbo.AdminSetting")
        await sql.close()
        // console.log(result.recordsets)
        this.setState({
            adminSettingList: result.recordsets
        })
    }

    render() {
     
        return (
            <div>
                <div className="box cal" id="admin">

                    <h3>Extra Services</h3><br></br>
                    <div>
                        <form>
                            <div className="box">
                                <div className="row">
                                    <div className="col-sm-6"><b>Service Name: </b><br></br></div>
                                    <div className="col-sm-6"><input name="ServiceName" type="text" value={this.state.extraService.ServiceName} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Cost: </b><br></br></div>
                                    <div className="col-sm-6"><input name="Cost" type="number" value={this.state.extraService.Cost} onChange={this.handleChange} /><br></br></div>
                                </div>
                            </div>
                            <br></br>
                            <button className="profileButton" onClick={this.handleAddService}> Add </button>
                            <br></br>
                        </form>
                    </div>
                    <div id="adminList">
                        <table id="tblAdminList" className="table table-hover tableAdmin">
                            <thead>
                                <tr>
                                    <th>
                                        Service Name
                        </th>
                                    <th>
                                        Cost($)
                        </th>

                                    <th>
                                        Delete
                        </th>                
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.extraServiceList.map((el, index) => {
                                        return (
                                            <tr key={index}>
                                                <td>{el.ServiceName}</td>
                                                <td>{el.Cost}</td>
                                                <td>
                                                    <a title="delete" onClick={(e) => this.handleDeleteService(e, el.ServiceName, el.Cost)}><span className="glyphicon glyphicon-trash" aria-hidden="true" style={{cursor:'pointer'}}></span></a>
                                                    
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