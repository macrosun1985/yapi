import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { message, Tooltip, Input } from 'antd'
import { fetchInterfaceColList, setColData, fetchCaseData, fetchCaseList } from '../../../../reducer/modules/interfaceCol'
import { Postman } from '../../../../components'

import './InterfaceCaseContent.scss'

@connect(
  state => {
    return {
      interfaceColList: state.interfaceCol.interfaceColList,
      currColId: state.interfaceCol.currColId,
      currCaseId: state.interfaceCol.currCaseId,
      currCase: state.interfaceCol.currCase,
      isShowCol: state.interfaceCol.isShowCol,
      currProject: state.project.currProject
    }
  },
  {
    fetchInterfaceColList,
    fetchCaseData,
    setColData,
    fetchCaseList
  }
)
@withRouter
export default class InterfaceCaseContent extends Component {

  static propTypes = {
    match: PropTypes.object,
    interfaceColList: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    fetchCaseData: PropTypes.func,
    setColData: PropTypes.func,
    fetchCaseList: PropTypes.func,
    history: PropTypes.object,
    currColId: PropTypes.number,
    currCaseId: PropTypes.number,
    currCase: PropTypes.object,
    isShowCol: PropTypes.bool,
    currProject: PropTypes.object
  }

  state = {
    isEditingCasename: true,
    editCasename: ''
  }

  constructor(props) {
    super(props)
  }

  getColId(colList, currCaseId) {
    let currColId = 0;
    colList.forEach(col => {
      col.caseList.forEach(caseItem => {
        if (+caseItem._id === +currCaseId) {
          currColId = col._id;
        }
      })
    })
    return currColId;
  }

  async componentWillMount() {
    const result = await this.props.fetchInterfaceColList(this.props.match.params.id)
    let { currCaseId } = this.props;
    const params = this.props.match.params;
    const { actionId } = params;
    currCaseId = +actionId || +currCaseId || result.payload.data.data[0].caseList[0]._id;
    let currColId = this.getColId(result.payload.data.data, currCaseId);
    this.props.history.push('/project/' + params.id + '/interface/case/' + currCaseId)
    await this.props.fetchCaseData(currCaseId)
    this.props.setColData({currCaseId: +currCaseId, currColId, isShowCol: false})
    this.setState({editCasename: this.props.currCase.casename})
  }

  async componentWillReceiveProps(nextProps) {
    const oldCaseId = this.props.match.params.actionId
    const newCaseId = nextProps.match.params.actionId
    const { interfaceColList } = nextProps;
    let currColId = this.getColId(interfaceColList, newCaseId);
    if (oldCaseId !== newCaseId) {
      await this.props.fetchCaseData(newCaseId);
      this.props.setColData({currCaseId: +newCaseId, currColId, isShowCol: false})
      this.setState({editCasename: this.props.currCase.casename})
    }
  }

  savePostmanRef = (postman) => {
    this.postman = postman;
  }

  updateCase = async () => {
    
    const {
      caseEnv: case_env,
      pathname: path,
      method,
      pathParam: req_params,
      query: req_query,
      headers: req_headers,
      bodyType: req_body_type,
      bodyForm: req_body_form,
      bodyOther: req_body_other,
      resMockTest: mock_verify
    } = this.postman.state;
    
    const {editCasename: casename} = this.state;
    const {_id: id} = this.props.currCase;
    let params = {
      id,
      casename,
      case_env,
      path,
      method,
      req_params,
      req_query,
      req_headers,
      req_body_type,
      req_body_form,
      req_body_other,
      mock_verify
    };
    if(this.postman.state.test_status !== 'error'){
      params.test_res_body = this.postman.state.res;
      params.test_report = this.postman.state.validRes;
      params.test_status = this.postman.state.test_status;
      params.test_res_header = this.postman.state.resHeader;
    }

 
    if(params.test_res_body && typeof params.test_res_body === 'object'){
      params.test_res_body = JSON.stringify(params.test_res_body, null, '   ');
    }

    const res = await axios.post('/api/col/up_case', params);
    if (this.props.currCase.casename !== casename) {
      this.props.fetchInterfaceColList(this.props.match.params.id);
    }
    if (res.data.errcode) {
      message.error(res.data.errmsg)
    } else {
      message.success('更新成功')
      this.props.fetchCaseData(id);
    }
  }

  triggerEditCasename = () => {
    this.setState({
      isEditingCasename: true,
      editCasename: this.props.currCase.casename
    })
  }
  cancelEditCasename = () => {
    this.setState({
      isEditingCasename: false,
      editCasename: this.props.currCase.casename
    })
  }

  render() {
    const { currCase, currProject } = this.props;
    const { isEditingCasename, editCasename } = this.state;
    const data = Object.assign({}, currCase, currProject, {_id: currCase._id});
    return (
      <div style={{padding: '6px 0'}} className="case-content">
        <div className="case-title">
          {!isEditingCasename && <Tooltip title="点击编辑" placement="bottom"><div className="case-name" onClick={this.triggerEditCasename}>
            {currCase.casename}
          </div></Tooltip>}

          {isEditingCasename && <div className="edit-case-name">
            <Input value={editCasename} onChange={e => this.setState({editCasename: e.target.value})} style={{fontSize: 18}} />
            {/*<Button
              title="Enter"
              onClick={this.saveCasename}
              type="primary"
              style={{ marginLeft: 8 }}
            >保存</Button>
            <Button
              title="Esc"
              onClick={this.cancelEditCasename}
              type="primary"
              style={{ marginLeft: 8 }}
            >取消</Button>*/}
          </div>}
          <span className="inter-link" style={{margin: '0px 8px 0px 6px', fontSize: 12}}>
            <Link className="text" to={`/project/${currProject._id}/interface/api/${currCase.interface_id}`}>对应接口</Link>
          </span>
        </div>
        <div>
          <Postman data={data} type="case" saveTip="更新保存修改" save={this.updateCase} ref={this.savePostmanRef} />
        </div>
      </div>
    )
  }
}
